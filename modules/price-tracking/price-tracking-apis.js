const xlsx = require('node-xlsx'); const fs = require('fs'); const AWS = require('aws-sdk');
const executeDBQuery = require('../../helpers/query-execution-helper.js');
const { format } = require('path');
const { query } = require('express');

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
    let { customer_id, products } = req.body;
    let currentProducts = [];
    try {
        //#region Product Search is required
        if (products != null && products.length != 0) {
            for (let index = 0; index < products.length; index++) {
                let query1 = {
                    name: `Checking if product with given name exists in a fuzzy manner`,
                    text: `SELECT product_id, product_name
                    FROM product 
                    WHERE product_name ILIKE $1;`,
                    values: [`%${products[index]}%`]
                }
                const queryResult1 = await executeDBQuery(query1);
                //If some products returned from this query
                if (queryResult1.rows.length !== 0) {
                    for (let i = 0; i < queryResult1.rows.length; i++) {
                        const element = queryResult1.rows[i];
                        //Getting current_quantity of each product that we search for
                        let query1 = {
                            name: `Gathering all products and their current stock`,
                            text: `SELECT ps.product_id, p.product_name, ps.current_quantity FROM product_stock AS ps
                            JOIN product AS p ON ps.product_id = p.product_id
                            WHERE ps.customer_id = $1 AND ps.product_id = $2;`,
                            values: [customer_id, element.product_id]
                        }
                        const queryResult1Point5 = await executeDBQuery(query1);
                        if (queryResult1Point5.rows.length !== 0) {
                            currentProducts.push(queryResult1Point5.rows[0]);
                        }
                    }
                }
            }
        }
        //#endregion

        //#region If no products specifically to search for are given, search for all products in stock of that customer
        else {
            //Gathering all products and their current stock
            let query1 = {
                name: `Gathering all products and their current stock`,
                text: `SELECT ps.product_id, p.product_name, ps.current_quantity FROM product_stock AS ps
                JOIN product AS p ON ps.product_id = p.product_id
                WHERE ps.customer_id = $1;`,
                values: [customer_id]
            }
            const queryResult1 = await executeDBQuery(query1);
            currentProducts = queryResult1.rows;
        }
        //#endregion

        //#region Finding latest and just before latest supplied supplier's purchase details
        for (let i = 0; i < currentProducts.length; i++) {
            currentProducts[i];
            let query2 = {
                name: `Latest Supplier's price`,
                text: `SELECT supplier_name, unit_price, date FROM invoice_item as ii
                JOIN supplier as s ON s.supplier_id = ii.supplier_id
                WHERE product_id = $1 AND customer_id = $2
                ORDER BY date DESC LIMIT 2;`,
                values: [currentProducts[i].product_id, customer_id]
            }
            let queryResult2 = await executeDBQuery(query2);
            //In case this product was never bought
            currentProducts[i].latest_supplier_name = "";
            currentProducts[i].latest_supplier_unit_price = "";
            currentProducts[i].latest_supplier_date = "";


            if (queryResult2.rows.length > 0) { //If first element exists
                currentProducts[i].latest_supplier_name = queryResult2.rows[0].supplier_name;
                currentProducts[i].latest_supplier_unit_price = queryResult2.rows[0].unit_price;
                currentProducts[i].latest_supplier_date = queryResult2.rows[0].date;
            }

            //In case no previous to this one supplier exists
            currentProducts[i].prev_supplier_name = "";
            currentProducts[i].prev_supplier_unit_price = "";
            currentProducts[i].prev_supplier_date = "";

            if (queryResult2.rows.length > 1) { //If second element also exists
                currentProducts[i].prev_supplier_name = queryResult2.rows[1].supplier_name;
                currentProducts[i].prev_supplier_unit_price = queryResult2.rows[1].unit_price;;
                currentProducts[i].prev_supplier_date = queryResult2.rows[1].date;
            }
        }
        //#endregion

        //#region Finding one month before latest puchase date
        for (let i = 0; i < currentProducts.length; i++) {
            const date = new Date(currentProducts[i].latest_supplier_date);
            date.setMonth(date.getMonth() - 1);
            const one_month_before_date = date.toISOString();

            let query3 = {
                name: `Cheapest supplier supplying within last month for any customer`,
                text: `SELECT supplier_name, date, unit_price 
                FROM invoice_item AS ii 
                JOIN supplier as s ON s.supplier_id = ii.supplier_id
                WHERE product_id = $1
                AND date BETWEEN $2 AND $3
                ORDER BY unit_price ASC
                LIMIT 1;`,
                values: [currentProducts[i].product_id, one_month_before_date, currentProducts[i].latest_supplier_date]
            }

            let queryResult3 = await executeDBQuery(query3);
            currentProducts[i].minimum_overall_supplier_name = queryResult3.rows[0].supplier_name;
            currentProducts[i].minimum_overall_supplier_unit_price = queryResult3.rows[0].unit_price;
            currentProducts[i].minimum_overall_supplier_date = queryResult3.rows[0].date;
        }
        //#endregion

        //#region Writing to Excel file
        // Get the column names from the first row of the result
        let columnNames = Object.keys(currentProducts[0]);
        columnNames = columnNames.map(name => {
            // Replace underscores with spaces
            let formattedName = name.replace(/_/g, ' ');
            // Capitalize the first letter of each word and make the rest of the letters uppercase
            formattedName = formattedName.replace(/\b\w/g, c => c.toUpperCase());
            return formattedName;
        });

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

        //#region  Upload the file to S3 and create URL
        // Create an S3 client
        const s3 = new AWS.S3({
            signatureVersion: 'v4'
        });

        // Set the parameters for the upload
        const uploadParams = {
            Bucket: 'garibaldi-arken-sheet-bucket',
            Key: 'output.xlsx',
            Body: buffer,
        };

        var uploadLocation = await uploadToS3(s3, uploadParams);
        //#endregion

        return res.status(201).json({ success: true, count: currentProducts.length, sheet_url: uploadLocation, data: currentProducts });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#region  Private functions
async function uploadToS3(s3, uploadParams) {
    try {
        // Upload the object to Amazon S3
        const data = await s3.upload(uploadParams).promise();

        // Set the parameters for the pre-signed URL
        const signedUrlParams = {
            Bucket: uploadParams.Bucket,
            Key: uploadParams.Key,
            Expires: 21600 // 6 hours in seconds
        };

        // Generate the pre-signed URL
        const url = await s3.getSignedUrlPromise('getObject', signedUrlParams);
        return url;
    } catch (err) {
        console.log("Error", err);
    }
}

//#endregion

module.exports = { findMinPriceBetweenTwoDates, findMinPriceBetweenTwoDates_FuzzySearch, customerProductPriceTracking }