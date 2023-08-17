const xlsx = require('node-xlsx'); const fs = require('fs');
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
            output.push(`################# Start of ${product_ids[i]} #############`);

            let product_id = product_ids[i];
            let query3 = {
                name: `Return min within date range`,
                text: `SELECT ii.unit_price, ii.date, p.product_name, s.supplier_name
                        FROM invoice_item AS ii
                        JOIN product AS p ON ii.product_id = p.product_id
                        JOIN supplier AS s ON ii.supplier_id = s.supplier_id
                        WHERE ii.product_id IN ($1) AND ii.customer_id = $2 AND ii.date BETWEEN $3 AND $4
                        ORDER BY ii.unit_price ASC
                        LIMIT 1;`,
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

const customerProductPriceTracking = async (req, res) => {
    let { customer_id } = req.body;
    let currentProducts = [];
    try {
        //Gathering all products and their current stock
        let query1 = {
            name: `Gathering all products and their current stock`,
            text: `SELECT ps.product_id, p.product_name, ps.current_quantity FROM product_stock AS ps
            JOIN product AS p ON ps.product_id = p.product_id
            WHERE ps.customer_id = $1 ;`,
            values: [customer_id]
        }
        const queryResult1 = await executeDBQuery(query1);
        currentProducts = queryResult1.rows;
        //Finding latest supplied supplier's price
        for (let i = 0; i < currentProducts.length; i++) {
            currentProducts[i];
            let query2 = {
                name: `Finding latest supplied supplier's price`,
                text: `SELECT supplier_name, unit_price, date FROM invoice_item as ii
                JOIN supplier as s ON s.supplier_id = ii.supplier_id
                WHERE product_id = $1 AND customer_id = $2 
                ORDER BY date DESC LIMIT 1;`,
                values: [currentProducts[i].product_id, customer_id]
            }
            await executeDBQuery(query2).then(queryResult2 => {
                currentProducts[i].latest_supplier_name = queryResult2.rows[0].supplier_name;
                currentProducts[i].latest_supplier_unit_price = queryResult2.rows[0].unit_price;
                currentProducts[i].latest_supplier_date = queryResult2.rows[0].date;
            });
        }
        for (let i = 0; i < currentProducts.length; i++) {
            //Finding one month before latest puchase date
            const date = new Date(currentProducts[i].latest_supplier_date);
            date.setMonth(date.getMonth() - 1);
            const one_month_before_date = date.toISOString();

            let query3 = {
                name: `Cheapest supplier supplying within last month`,
                text: `SELECT supplier_name, date, unit_price 
                FROM invoice_item AS ii 
                JOIN supplier as s ON s.supplier_id = ii.supplier_id
                WHERE product_id = $1 AND customer_id = $2
                AND date BETWEEN $3 AND $4
                ORDER BY unit_price ASC
                LIMIT 1;`,
                values: [currentProducts[i].product_id, customer_id, one_month_before_date, currentProducts[i].latest_supplier_date]
            }

            //#TOASK: To prevent a promise skipped condition, we have to write the rest inside this. That doesn't look good. How to avoid that?
            await executeDBQuery(query3).then(queryResult3 => {
                currentProducts[i].min_supplier_name = queryResult3.rows[0].supplier_name;
                currentProducts[i].min_supplier_unit_price = queryResult3.rows[0].unit_price;
                currentProducts[i].min_supplier_date = queryResult3.rows[0].date;
            });
            //#region Writing to Excel file
            // Get the column names from the first row of the result
            const columnNames = Object.keys(currentProducts[0]);

            // Create an array of arrays, where each inner array represents a row in the Excel file
            const data = [columnNames];

            // Add the data from the SQL query result to the data array
            for (const row of currentProducts) {
                data.push(Object.values(row));
            }

            // Create a buffer from the data array
            const buffer = xlsx.build([{ name: "Sheet1", data }]);

            const filePath = './excel_sheets/output.xlsx';
            fs.writeFileSync(filePath, buffer);
            //#endregion
        }
        return res.status(201).json({ success: true, count: currentProducts.length, data: currentProducts });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}
module.exports = { findMinPriceBetweenTwoDates, findMinPriceBetweenTwoDates_FuzzySearch, customerProductPriceTracking }