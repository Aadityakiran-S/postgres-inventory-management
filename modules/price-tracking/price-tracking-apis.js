const executeDBQuery = require('../../helpers/query-execution-helper.js');

const findMinPriceBtweenTwoDates = async (productName, supplierName, customerID, date1, date2) => {
    try {
        //TODO: DO whatever here
        //#region Checking if product with given name exists
        let query1 = {
            name: `Checking if product with given name exists`,
            text: `SELECT EXISTS (SELECT 1 FROM product WHERE product_name = $1);`,
            values: [productName]
        }
        const queryResult1 = await executeDBQuery(query1);
        if (!queryResult1.rows[0].exists) {
            return res.status(404).json({ success: false, message: `Product with name: ${productName} DNE` });
        }
        //#endregion
        //#region Checking if supplier with given name exists
        let query2 = {
            name: `Checking if product with given name exists`,
            text: `SELECT EXISTS (SELECT 1 FROM product WHERE product_name = $1);`,
            values: [productName]
        }
        const queryResult2 = await executeDBQuery(query2);
        if (!queryResult2.rows[0].exists) {
            return res.status(404).json({ success: false, message: `Product with name: ${productName} DNE` });
        }
        //#endregion
        let query3 = {
            name: `Return min within date range`,
            text: `SELECT * FROM invoice_item WHERE supplier_id = $1 AND product_id = $2 AND date BETWEEN $3 AND $4 ORDER BY unit_price ASC LIMIT 1;`,
            values: [supplierID, productID, date1, date2]
        }
        const queryResult3 = await executeDBQuery(query3);
        return res.status(201).json({ success: true, data: queryResult3.rows });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { findMinPriceBtweenTwoDates }