const executeDBQuery = require('../../helpers/query-execution-helper.js');

//#TODO show supplier_id also in this API
//#TODO: Create a new API for fuzzy search "rice" where products can be "white rice", "red rice" ...

const findMinPriceBtweenTwoDates = async (req, res) => {
    let { product_id, start_date, end_date, customer_id } = req.body;
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

        let query3 = {
            name: `Return min within date range`,
            text: `SELECT ii.unit_price, ii.date, p.product_name, s.supplier_name
            FROM invoice_item AS ii
            JOIN product AS p ON ii.product_id = p.product_id
            JOIN supplier AS s ON ii.supplier_id = s.supplier_id
            WHERE ii.product_id = $1 AND ii.customer_id = $2 AND ii.date BETWEEN $3 AND $4
            ORDER BY ii.unit_price ASC 
            LIMIT 1;`,
            values: [product_id, customer_id, start_date, end_date]
        }
        const queryResult3 = await executeDBQuery(query3);
        return res.status(201).json({ success: true, data: queryResult3.rows });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { findMinPriceBtweenTwoDates }