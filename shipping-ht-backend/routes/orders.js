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


router.post("/", async (req, res) => {
    const { isExist } = req.query;
    let connection;
  
    try {
      connection = await getConnection();
  
      // Base SQL fields
      const commonSql = `
        INSERT INTO spoptrnf (
          fpoptermid,
          fpoptrnno,
          fpoptrn1,
          fpoptrn2,
          fpoptrn3,
          fpopqty,
          fpopunit,
          fitemno,
          flotno,
          flotno2,
          fwhcd,
          fstttme,
          fodrflg,
          fodrno,
          fnote,
          fpopupdate,
          fflsegment01,
          fflsegment02
        )
      `;
  
      let sql, binds;
  
      if (isExist) {
        sql = `
          ${commonSql}
          VALUES (
            'BARCODE',
            :fpoptrnno,
            'SHP',
            'ISS',
            'ALC',
            0,
            :zinvqty_v_funit,
            :zinvqty_v_fitemnofitemno,
            :zinvqty_v_flotno,
            :zinvqty_v_flotno2,
            :zinvqty_v_fwhcd,
            SYSDATE,
            :zshpins_v_fodrflg,
            :zshpins_v_fodrno,
            '',
            'W',
            :zinvqty_v_flctcd,
            :zinvqty_v_frank
          )
        `;
  
        binds = {
          fpoptrnno: req.body.fpoptrnno,
          zinvqty_v_funit: req.body.zinvqty_v_funit,
          zinvqty_v_fitemnofitemno: req.body.zinvqty_v_fitemnofitemno,
          zinvqty_v_flotno: req.body.zinvqty_v_flotno,
          zinvqty_v_flotno2: req.body.zinvqty_v_flotno2,
          zinvqty_v_fwhcd: req.body.zinvqty_v_fwhcd,
          zshpins_v_fodrflg: req.body.zshpins_v_fodrflg,
          zshpins_v_fodrno: req.body.zshpins_v_fodrno,
          zinvqty_v_flctcd: req.body.zinvqty_v_flctcd,
          zinvqty_v_frank: req.body.zinvqty_v_frank
        };
      } else {
        sql = `
          ${commonSql}
          VALUES (
            'BARCODE',
            :fpoptrnno,
            'SHP',
            'ISS',
            'ALC',
            :zinvqty_v_fohqty,
            :zinvqty_v_funit,
            :zinvqty_v_fitemnofitemno,
            :zinvqty_v_flotno,
            :zinvqty_v_flotno2,
            :zinvqty_v_fwhcd,
            SYSDATE,
            :zshpins_v_fodrflg,
            :zshpins_v_fodrno,
            '',
            'W',
            :zinvqty_v_flctcd,
            :zinvqty_v_frank
          )
        `;
  
        binds = {
          fpoptrnno: req.body.fpoptrnno,
          zinvqty_v_fohqty: req.body.zinvqty_v_fohqty,
          zinvqty_v_funit: req.body.zinvqty_v_funit,
          zinvqty_v_fitemnofitemno: req.body.zinvqty_v_fitemnofitemno,
          zinvqty_v_flotno: req.body.zinvqty_v_flotno,
          zinvqty_v_flotno2: req.body.zinvqty_v_flotno2,
          zinvqty_v_fwhcd: req.body.zinvqty_v_fwhcd,
          zshpins_v_fodrflg: req.body.zshpins_v_fodrflg,
          zshpins_v_fodrno: req.body.zshpins_v_fodrno,
          zinvqty_v_flctcd: req.body.zinvqty_v_flctcd,
          zinvqty_v_frank: req.body.zinvqty_v_frank
        };
      }
  
      const result = await connection.execute(sql, binds, { autoCommit: true });
  
      res.json({
        message: "Insert successful",
        rowsAffected: result.rowsAffected
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

router.get("/barcode/lookup", async (req, res) => {
    const { barcode, fshpno } = req.query;
  
    if (!barcode || barcode.length < 13) {
      return res.status(400).json({ error: "バーコードが不正です。(min 13桁)" });
    }
    if (!fshpno) {
      return res.status(400).json({ error: "出荷Noが必須です。" });
    }
  
    // Split barcode into flotno (first 10 digits) + flotno2 (last 3 digits)
    const flotno = barcode.substring(0, 10);
    const flotno2 = barcode.substring(10, 13);
  
    let connection;
    try {
      connection = await getConnection();
  
      const sql = `
        SELECT *
          FROM ZINVQTY_V ZI
          JOIN ZSHPINS_V ZS
            ON ZS.FLOTNO = ZI.FLOTNO
         WHERE ZI.FLOTNO  = :flotno
           AND ZI.FLOTNO2 = :flotno2
           AND ZS.FSHPNO  = :fshpno
           AND ZS.FINVSITE = ZI.FINVSITE
      `;
  
      const binds = { flotno, flotno2, fshpno };
  
      const result = await connection.execute(sql, binds, { outFormat: require("oracledb").OUT_FORMAT_OBJECT });
  
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