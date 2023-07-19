const executeDBQuery = require('../../helpers/query-execution-helper.js');

const findMinPriceBtweenTwoDates = async (req, res) => {
    let { product_id, supplier_id, start_date, end_date } = req.body;
    let customer_id = 1; //#ALERT c_id given here because it's always known?
    try {
        //#region Checking if product with given name exists
        let query1 = {
            name: `Checking if product with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM product WHERE product_id = $1);`,
            values: [product_id]
        }
        const queryResult1 = await executeDBQuery(query1);
        if (!queryResult1.rows[0].exists) {
            return res.status(404).json({ success: false, message: `Product with id: ${product_id} DNE` });
        }
        //#endregion

        //#region Checking if supplier with given name exists
        let query2 = {
            name: `Checking if supplier with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM supplier WHERE supplier_id = $1);`,
            values: [supplier_id]
        }
        const queryResult2 = await executeDBQuery(query2);
        if (!queryResult2.rows[0].exists) {
            return res.status(404).json({ success: false, message: `Supplier with id: ${supplier_id} DNE` });
        }
        //#endregion

        let query3 = {
            name: `Return min within date range`,
            text: `SELECT unit_price, invoice_id, date, invoice_item_id FROM invoice_item WHERE supplier_id = $1 AND product_id = $2 AND customer_id = $3 AND date BETWEEN $4 AND $5 ORDER BY unit_price ASC LIMIT 1;`,
            values: [supplier_id, product_id, customer_id, start_date, end_date]
        }
        const queryResult3 = await executeDBQuery(query3);
        return res.status(201).json({ success: true, data: queryResult3.rows });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { findMinPriceBtweenTwoDates }