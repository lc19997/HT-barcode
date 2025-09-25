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
                P.FSECTSN,
                P.FEMAILADDR,
                P.FVALIDDTE,
                P.FINVALIDDTE,
                '1' || substr(p.fuppsect, 2, 1) + 1 FFACTSITE
            FROM SECTM P
        `);


        // const result = await connection.execute(`
        //     SELECT
        //         P.FSECTCD,
        //         P.FSECTLN,
        //         P.FUPPSECT,
        //         S.FSECTSN,
        //         P.FEMAILADDR,
        //         P.FVALIDDTE,
        //         P.FINVALIDDTE,
        //         '1' || substr(p.fuppsect, 2, 1) + 1 FFACTSITE
        //     FROM SECTM P
        //     JOIN SECTM S 
        //         ON S.FSECTCD = P.FUPPSECT
        //     WHERE P.FUPPSECT LIKE '6_8000'
        //     AND P.FINVALIDDTE > SYSDATE
        //     ORDER BY FSECTCD DESC
        // `);

        console.log(result);


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
            SELECT ZS.*,
                   0 AS FPOPPCS,
                   0 AS FPOPQTY
            FROM ZSHPINS_V ZS
            WHERE ZS.FINVSITE = :FFACTSITE
              AND FSHPODRSTS IN ('R')
        `;

        // ✅ add filter condition if keyword provided
        if (keyword && keyword.trim() !== "") {
            sql += ` AND ZS.FSHPNO LIKE :FILTER`;
        }

        // ✅ bind values
        const binds = { FFACTSITE: shipper };
        if (keyword && keyword.trim() !== "") {
            binds.FILTER = `${keyword}%`; // starts with
        }

        const result = await connection.execute(sql, binds);

        console.log("rows:", result.rows.length);

        res.json(result.rows.map(row => ({
            shippingNo: row[0],   // FSHPNO
            fgrade: row[64],      // check column index mapping
            ffabricnum: row[65],
            fpoppcs: row[69],
            flotno: row[56]
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
    const { lotNo, subLotNo, orderType, orderNo } = req.body;

    if (!lotNo || !subLotNo || !orderType || !orderNo) {
        return res.status(400).json({
            error: "lotNo, subLotNo, orderType, orderNo are required.",
        });
    }

    let connection;

    try {
        connection = await getConnection();

        const sql = `
      UPDATE test99.spoptrnf
         SET fpopupdate = '0'
       WHERE flotno   = :lotNo
         AND flotno2  = :subLotNo
         AND fodrflg  = :orderType
         AND fodrno   = :orderNo
         AND fpopupdate = 'W'
    `;

        const binds = {
            lotNo,
            subLotNo,
            orderType,
            orderNo,
        };

        const result = await connection.execute(sql, binds, { autoCommit: true });

        res.json({
            updatedRows: result.rowsAffected || 0,
            message: "fpopupdate updated to '0' where fpopupdate was 'W'.",
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


// Add similar for /orders, /allocated, /save-allocation (INSERT)
module.exports = router;