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
        const { shipper } = req.query;
        const binds = shipper;
        console.log("ffactsite:", shipper);
        let sql = `
            SELECT ZS.*,
            0 AS FPOPPCS,
            0 AS FPOPQTY
            FROM ZSHPINS_V ZS
            WHERE ZS.FINVSITE = :FFACTSITE
            AND FSHPODRSTS IN ('R')
            `;
        const result = await connection.execute(sql, { FFACTSITE: shipper });

        // if (filter) {
        //     sql += ` AND shippingno LIKE :filter`;
        //     binds.filter = `${filter}%`;  // prefix match
        // }

        // if (shipper) {
        //     sql += ` AND name = :shipper`; // assuming you have a shipper column
        //     binds.shipper = shipper;
        // }


        console.log(result);
        res.json(result.rows.map(row => ({
            shippingNo: row[0],
            grade: row[1],
            instructedQty: row[2],
            allocatedQty: row[3]
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});


// Add similar for /orders, /allocated, /save-allocation (INSERT)
module.exports = router;