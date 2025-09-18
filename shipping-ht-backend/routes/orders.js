const express = require('express');
const getConnection = require('../db/connection');
const router = express.Router();

router.get('/shippers', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute('SELECT name, code FROM shipper');  // Provided SQL
        res.json(result.rows.map(row => ({ name: row[0], code: row[1] })));
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
        const { filter, shipper } = req.query;

        let sql = `
      SELECT shippingno, grade, instructedqty, allocatedqty
      FROM orders
      WHERE 1=1
    `;
        const binds = {};

        if (filter) {
            sql += ` AND shippingno LIKE :filter`;
            binds.filter = `${filter}%`;  // prefix match
        }

        if (shipper) {
            sql += ` AND name = :shipper`; // assuming you have a shipper column
            binds.shipper = shipper;
        }

        const result = await connection.execute(sql, binds);
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