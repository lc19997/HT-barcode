const express = require('express');
const getConnection = require('../db/connection');
const router = express.Router();

router.get('/shippers', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                P.FSECTCD,
                P.FSECTLN,
                P.FUPPSECT,
                S.FSECTSN,
                P.FEMAILADDR,
                P.FVALIDDTE,
                P.FINVALIDDTE,
                '1' || substr(p.fuppsect, 2, 1) + 1 FFACTSITE
            FROM SECTM P
            JOIN SECTM S 
                ON S.FSECTCD = P.FUPPSECT
            WHERE P.FUPPSECT LIKE '6_8000'
            AND P.FINVALIDDTE > SYSDATE
            ORDER BY FSECTCD DESC
        `);

        res.json(result.rows.map(row => ({ name: row[0], code: row[1], factorycode: row[7] })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/orders', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { shipper, keyword } = req.query;

        console.log("ffactsite:", shipper, "filter:", keyword);

        // ✅ base SQL
        let sql = `
            SELECT
                ZS.FSHPNO,
                ZS.FODRFLG,
                FODRFLGNM,
                FSHPODRSTS,
                FSHPODRSTSSN,
                ZS.FODRNO,
                ZS.FODRNO2,
                ZS.FSLSODRNO,
                ZS.FSLSODRLINE,
                ZS.FGRADE,
                ZS.FFABRICNUM,
                ZS.FLOTNO,
                NVL(SUM(
                        CASE
                            WHEN SP.FPOPUPDATE IN ('W') THEN 1
                            WHEN SP.FPOPQTY = 0 THEN -1
                            ELSE 1
                        END
                ),0) AS FPOPPCS,
                ZS.FSHPODRQTY,
                NVL(SUM(
                        CASE
                            WHEN SP.FPOPUPDATE IN ('W') THEN SP.FPOPQTY
                            ELSE 0
                        END
                ),0) + ZS.FSHPQTY AS FPOPQTY
            FROM ZSHPINS_V ZS
            LEFT JOIN SPOPTRNF SP
                ON SP.FODRNO = ZS.FODRNO
                AND SP.FODRFLG = ZS.FODRFLG
                AND SP.FPOPUPDATE IN ('0','2','W')
                AND SP.FPOPTERMID = 'BARCODE'
            WHERE
                (ZS.FINVSITE = :FFACTSITE
                    OR REGEXP_REPLACE(ZS.FCUSTCD, '^.*A(\d)$', '1\\1') = :FFACTSITE)
            AND ZS.FSHPODRSTS IN ('R')
            GROUP BY
                ZS.FSHPNO,
                ZS.FODRFLG,
                FODRFLGNM,
                FSHPODRSTS,
                FSHPODRSTSSN,
                ZS.FODRNO,
                ZS.FODRNO2,
                ZS.FSLSODRNO,
                ZS.FSLSODRLINE,
                ZS.FGRADE,
                ZS.FFABRICNUM,
                ZS.FSHPODRQTY,
                ZS.FSHPQTY,
                ZS.FLOTNO
        `;


        // ✅ bind values
        const binds = { FFACTSITE: shipper };

        const result = await connection.execute(sql, binds);

        console.log("rows:", result);

        res.json(result.rows.map(row => ({
            shippingNo: row[0],   // FSHPNO
            fgrade: row[9],      // check column index mapping
            ffabricnum: row[10],
            fpoppcs: row[12],
            flotno: row[11],
            fodrflg: row[1],
            fodrno: row[5]
        })));

    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/barcode-data', async (req, res) => {
    const { lotNo, subLotNo, shippingNo } = req.query;
    let connection;

    if (!lotNo || !subLotNo || !shippingNo) {
        return res.status(400).json({ error: "lotNo, subLotNo, shippingNo は必須です。" });
    }

    try {
        connection = await getConnection();

        let sql = `
        SELECT 
            ZI.*,
            ZS.FSHPNO,
            ZS.FINVSITE
        FROM ZINVQTY_V ZI
        JOIN ZSHPINS_V ZS 
            ON ZS.FLOTNO = ZI.FLOTNO
        AND ZS.FINVSITE = ZI.FINVSITE
        WHERE ZI.FLOTNO  = :lotNo
        AND ZI.FLOTNO2 = :subLotNo
        AND ZS.FSHPNO  = :shippingNo
            `;

        const binds = {
            lotNo: lotNo,           // e.g. first 10 digits from barcode
            subLotNo: subLotNo,     // e.g. last 3 digits from barcode
            shippingNo: shippingNo, // shipment number
        };

        const result = await connection.execute(sql, binds);

        console.log(result.rows);
        res.json(result.rows.map(row => ({
            FLOTNO: row[2],
            FLOTNO2: row[3],
            FRANK: row[4],
            FOHQTY: row[7]
        })));
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "DB処理に失敗しました。" });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { }
        }
    }
});

router.post("/save", async (req, res) => {
    const { barcodeData, fodrflg, fodrno } = req.body;

    if (!Array.isArray(barcodeData) || barcodeData.length === 0) {
        return res.status(400).json({ error: "barcodeData is required and must be an array." });
    }
    if (!fodrflg || !fodrno) {
        return res.status(400).json({ error: "fodrflg and fodrno are required." });
    }

    let connection;

    try {
        connection = await getConnection();

        let totalUpdated = 0;

        for (const item of barcodeData) {
            const { lotNo, subLotNo } = item;

            if (!lotNo || !subLotNo) continue;

            const sql = `
        UPDATE spoptrnf
           SET fpopupdate = '0'
         WHERE flotno   = :lotNo
           AND flotno2  = :subLotNo
           AND fodrflg  = :fodrflg
           AND fodrno   = :fodrno
           AND fpopupdate = 'W'
      `;

            const binds = {
                lotNo,
                subLotNo,
                fodrflg,
                fodrno,
            };

            const result = await connection.execute(sql, binds, { autoCommit: true });
            totalUpdated += result.rowsAffected || 0;
        }

        res.json({
            updatedRows: totalUpdated,
            message: `${totalUpdated} rows updated to fpopupdate = '0'.`,
        });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "Database update failed." });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Failed to close DB connection:", e);
            }
        }
    }
});

router.post("/add-barcode", async (req, res) => {
    const { barcode, fshpno, isExist } = req.body;

    if (!barcode || barcode.length < 13) {
        return res.status(400).json({ error: "バーコードが不正です。(min 13桁)" });
    }
    if (!fshpno) {
        return res.status(400).json({ error: "出荷Noが必須です。" });
    }

    const flotno = barcode.substring(0, 10);
    const flotno2 = barcode.substring(10, 13);

    let connection;
    try {
        connection = await getConnection();

        const seqSql = `SELECT SHPPOPTRNNO_SEQ.NEXTVAL AS SEQ FROM dual`;
        const seqResult = await connection.execute(seqSql);
        const fpoptrnno = seqResult.rows[0][0];
        // 1. Lookup first
        const lookupSql = `
            SELECT ZI.FLOTNO, ZI.FLOTNO2, ZI.FITEMNO, ZI.FUNIT, ZI.FWHCD,
                   ZI.FOHQTY, ZI.FLCTCD, ZI.FRANK,
                   ZS.FODRFLG, ZS.FODRNO
              FROM ZINVQTY_V ZI
              JOIN ZSHPINS_V ZS ON ZS.FLOTNO = ZI.FLOTNO
             WHERE ZI.FLOTNO  = SUBSTR('3253002301003', 1 , 10)
               AND ZI.FLOTNO2 = SUBSTR('3253002301003', 11 , 3) 
               AND ZS.FSHPNO  =  '0000000478' 
               AND ZS.FINVSITE = ZI.FINVSITE
        `;
        const lookupResult = await connection.execute(
            lookupSql,
            [], // ← bind variables (empty in your case)
        );

        if (lookupResult.rows.length === 0) {
            return res.status(404).json({ error: "対象データが見つかりません。" });
        }

        const row = lookupResult.rows[0];
        // console.log(row);

        // 2. Insert with lookup data
        const commonSql = `
            INSERT INTO spoptrnf (
              fpoptermid, fpoptrnno, fpoptrn1, fpoptrn2, fpoptrn3,
              fpopqty, fpopunit, fitemno, flotno, flotno2,
              fwhcd, fstttme, fodrflg, fodrno, fnote,
              fpopupdate, fflsegment01, fflsegment02
            )
        `;

        let updatedDisplayData = [];

        let sql, binds;
        if (isExist) {
            sql = `
              ${commonSql}
              VALUES (
                'BARCODE',
                :fpoptrnno,
                'SHP','ISS','ALC',
                0, :funit, :fitemno, :flotno, :flotno2,
                :fwhcd, SYSDATE, :fodrflg, :fodrno, '',
                'W', :flctcd, :frank
              )
            `;
            binds = {
                fpoptrnno: fpoptrnno, // from sequence
                funit: row[3],
                fitemno: row[2],
                flotno: row[0],
                flotno2: row[1],
                fwhcd: row[4],
                fodrflg: row[8],
                fodrno: row[9],
                flctcd: row[6],
                frank: row[7]
            };
            // 
        } else {
            sql = `
              ${commonSql}
              VALUES (
                'BARCODE',
                :fpoptrnno,
                'SHP','ISS','ALC',
                :fpopqty, :funit, :fitemno, :flotno, :flotno2,
                :fwhcd, SYSDATE, :fodrflg, :fodrno, '',
                'W', :flctcd, :frank
              )
            `;
            binds = {
                fpoptrnno: fpoptrnno, // from sequence
                fpopqty: row[5],
                funit: row[3],
                fitemno: row[2],
                flotno: row[0],
                flotno2: row[1],
                fwhcd: row[4],
                fodrflg: row[8],
                fodrno: row[9],
                flctcd: row[6],
                frank: row[7]
            };
            console.log("Lookup result:", binds);
            updatedDisplayData.push({
                FLOTNO: row[0],
                FLOTNO2: row[1],
                FRANK: row[7],   // if that’s the correct index
                FOHQTY: row[5]
            });
            console.log("updatedDisplayData:", updatedDisplayData);
        }

        const result = await connection.execute(sql, binds, { autoCommit: true });

        res.json({ message: "Insert successful", data: updatedDisplayData });

    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "DB処理に失敗しました。" });
    } finally {
        if (connection) {
            await connection.close().catch(e => console.error("Failed to close DB", e));
        }
    }
});

router.get("/barcode/lookup", async (req, res) => {
    const { barcode, fshpno } = req.query;

    if (!barcode || barcode.length < 13) {
        return res.status(400).json({ error: "バーコードが不正です。(min 13桁)" });
    }
    if (!fshpno) {
        return res.status(400).json({ error: "出荷Noが必須です。" });
    }

    // Split barcode → flotno (first 10 digits) + flotno2 (last 3 digits)
    const flotno = barcode.substring(0, 10);
    const flotno2 = barcode.substring(10, 13);

    let connection;
    try {
        connection = await getConnection();

        const sql = `
            SELECT ZI.*, ZS.*
              FROM ZINVQTY_V ZI
              JOIN ZSHPINS_V ZS
                ON ZS.FLOTNO = ZI.FLOTNO
             WHERE ZI.FLOTNO  = :flotno
               AND ZI.FLOTNO2 = :flotno2
               AND ZS.FSHPNO  = :fshpno
               AND ZS.FINVSITE = ZI.FINVSITE
        `;

        const binds = { flotno, flotno2, fshpno };

        const result = await connection.execute(sql, binds, {
            outFormat: require("oracledb").OUT_FORMAT_OBJECT
        });

        res.json({
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "DB処理に失敗しました。" });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Failed to close DB connection", e);
            }
        }
    }
});



router.get("/barcode/get", async (req, res) => {
    const { FODRFLG, FODRNO } = req.query;

    console.log("params:", req.query);

    if (!FODRFLG || !FODRNO) {
        return res.status(400).json({ error: "FODRFLG と FODRNO は必須です。" });
    }

    let connection;
    try {
        connection = await getConnection();

        const sql = `
      SELECT 
          flotno,
          flotno2,
          fflsegment02,
          fpopqty
      FROM spoptrnf main
      WHERE fodrflg = :fodrflg
        AND fodrno  = :fodrno
        AND NOT EXISTS (
              SELECT 'X'
              FROM spoptrnf ref
              WHERE ref.fpopqty = 0
                AND main.flotno  = ref.flotno
                AND main.flotno2 = ref.flotno2
                AND main.fodrno  = ref.fodrno
                AND main.fodrflg = ref.fodrflg
        )
    `;

        const binds = { FODRFLG, FODRNO };

        const result = await connection.execute(sql, binds, { outFormat: require("oracledb").OUT_FORMAT_OBJECT });
        // console.log(result.rows);

        res.json({
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "DB処理に失敗しました。" });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Failed to close DB connection", e);
            }
        }
    }
});

// Add similar for /orders, /allocated, /save-allocation (INSERT)
module.exports = router;