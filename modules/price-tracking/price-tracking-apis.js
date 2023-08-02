const { query } = require('express');
const executeDBQuery = require('../../helpers/query-execution-helper.js');

const findMinPriceBetweenTwoDates = async (req, res) => {
    let { product_name, start_date, end_date, customer_id } = req.body;
    let product_id;
    try {
        //#region Checking if product with given name exists
        let query1 = {
            name: `Checking if product with given name exists`,
            text: `SELECT EXISTS (SELECT 1 FROM product WHERE product_name = $1);`,
            values: [product_name]
        }
        const queryResult1 = await executeDBQuery(query1);
        if (!queryResult1.rows[0].exists) {
            return res.status(404).json({ success: false, message: `Product with name: ${product_name} DNE` });
        } else { //Product name exists, then fetch it's ID
            let query2 = {
                name: `Getting product_id of product with given name`,
                text: `SELECT product_id FROM product WHERE product_name = $1;`,
                values: [product_name]
            }
            const queryResult2 = await executeDBQuery(query2);
            product_id = queryResult2.rows[0].product_id;
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

const findMinPriceBetweenTwoDates_FuzzySearch = async (req, res) => {
    let { product_name, start_date, end_date, customer_id } = req.body;
    try {
        //#region Checking if product with given name exists in a fuzzy manner
        let query1 = {
            name: `Checking if product with given name exists in a fuzzy manner`,
            text: `SELECT * FROM product WHERE product_name ILIKE $1;`,
            values: [`%${product_name}%`]
        }
        const queryResult1 = await executeDBQuery(query1);
        if (queryResult1.rows.length === 0) {
            return res.status(404).json({ success: false, message: `No matches found for ${product_name} in database` });
        }
        //#endregion
        //Collecting product_ids of all matching results to array
        const product_ids = queryResult1.rows.map(item => item.product_id);
        let output = [];
        //Running price tracking query for each of IDs within the array
        for (let i = 0; i < product_ids.length; i++) {
            //Demarkating the collection of results of a new product
            output.push(`################# Start of new product #############`);

            let product_id = product_ids[i];
            let query3 = {
                name: `Return min within date range`,
                text: `SELECT ii.unit_price, ii.date, p.product_name, s.supplier_name
                        FROM invoice_item AS ii
                        JOIN product AS p ON ii.product_id = p.product_id
                        JOIN supplier AS s ON ii.supplier_id = s.supplier_id
                        WHERE ii.product_id IN ($1) AND ii.customer_id = $2 AND ii.date BETWEEN $3 AND $4
                        ORDER BY ii.unit_price ASC;`,
                values: [product_id, customer_id, start_date, end_date]
            }
            const queryResult3 = await executeDBQuery(query3);
            //Adding all results to output array
            queryResult3.rows.forEach(priceTrackingResult => {
                output.push(priceTrackingResult);
            });
        }
        //Showing output in response
        return res.status(201).json({ success: true, data: output });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { findMinPriceBetweenTwoDates, findMinPriceBetweenTwoDates_FuzzySearch }