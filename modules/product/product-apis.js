const executeDBQuery = require('../../helpers/query-execution-helper.js');

const listAllProducts = async (req, res) => {
    try {
        let listAllProducts = {
            name: `List all products`,
            text: `SELECT * FROM product`,
        }
        const queryResult = await executeDBQuery(listAllProducts);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const listProductsBySupplier = async (req, res) => {
    let { id: s_id } = req.params;
    try {
        //Checking if supplier with given id exists
        let query = {
            name: `Checking if supplier with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM supplier WHERE supplier_id = $1);`,
            values: [s_id]
        }
        const res1 = await executeDBQuery(query);
        if (!res1.rows[0].exists) {
            return res.status(500).json({ success: false, msg: `Supplier with ID ${s_id} DNE` });
        }

        let listAllProductsBySupplier = {
            name: `List all products by supplier`,
            text: `SELECT p.product_name FROM supplier_product sp JOIN product p ON sp.product_id = p.product_id WHERE sp.supplier_id = $1;`,
            values: [s_id]
        }
        const queryResult = await executeDBQuery(listAllProductsBySupplier);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const listAllProductsByCustomer = async (req, res) => {
    let { id: c_id } = req.params;
    try {
        //Checking if customer with given id exists
        let query = {
            name: `Checking if customer with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM customer WHERE customer_id = $1);`,
            values: [c_id]
        }
        const res1 = await executeDBQuery(query);
        if (!res1.rows[0].exists) {
            return res.status(500).json({ success: false, msg: `Customer with ID ${c_id} DNE` });
        }

        let listAllProductsByCustomer = {
            name: `List all products by customer`,
            text: `SELECT product_stock.product_id, product.product_name, product_stock.current_quantity
            FROM product_stock
            JOIN product
            ON product_stock.product_id = product.product_id
            WHERE product_stock.customer_id = $1;`,
            values: [c_id]
        }
        const queryResult = await executeDBQuery(listAllProductsByCustomer);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const listAllProductsByCustomerAndSupplier = async (req, res) => {
    let { supplier_id: s_id, start_date, end_date } = req.body;
    let c_id = 1; //#ALERT c_id given here because it's always known?
    try {
        //#region Error Check
        //Checking if supplier with given id exists
        let query1 = {
            name: `Checking if supplier with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM supplier WHERE supplier_id = $1);`,
            values: [s_id]
        }
        const res1 = await executeDBQuery(query1);
        if (!res1.rows[0].exists) {
            return res.status(500).json({ success: false, msg: `Supplier with ID ${s_id} DNE` });
        }
        //Checking if customer with given id exists
        let query2 = {
            name: `Checking if customer with given id exists`,
            text: `SELECT EXISTS (SELECT 1 FROM customer WHERE customer_id = $1);`,
            values: [c_id]
        }
        const res2 = await executeDBQuery(query2);
        if (!res2.rows[0].exists) {
            return res.status(500).json({ success: false, msg: `Customer with ID ${c_id} DNE` });
        }
        //#endregion

        let listAllProductsBySupplierAndCustomer = {
            name: `List all products by customer and supplier`,
            text: `SELECT invoice_item.product_id, product.product_name FROM invoice_item
            JOIN product ON invoice_item.product_id = product.product_id WHERE invoice_item.customer_id = $1 AND invoice_item.supplier_id = $2 AND invoice_item.date BETWEEN $3 AND $4;`,
            values: [c_id, s_id, start_date, end_date]
        }
        const queryResult = await executeDBQuery(listAllProductsBySupplierAndCustomer);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { listAllProducts, listProductsBySupplier, listAllProductsByCustomer, listAllProductsByCustomerAndSupplier }