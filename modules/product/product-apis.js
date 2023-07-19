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

const listAllProductsBySupplierAndCustomer = async (req, res) => {
    /*
    List all products that a Customer has bought from a particular Supplier: This one is a little tricky.The solution would be as follows.

    * Take the Invoice-Item table (between 2 dates since this query has to be like that to prevent an entire table scan).

    * Select for a given supplier_id and customer_id.

    * Join on the Product Table where product_id is the same in both to get product_name[s].
   */
    let { id: s_id } = req.params;
    try {
        let listAllProductsBySupplier = {
            name: `List all products by supplier`,
            text: `SELECT product_stock.product_id, product.product_name FROM product_stock
            JOIN product ON product_stock.product_id = product.product_id WHERE product_stock.customer_id = 'your_customer_id' AND product_stock.supplier_id = 'your_supplier_id' AND product_stock.date BETWEEN 'start_date' AND 'end_date';`,
            values: [s_id]
        }
        const queryResult = await executeDBQuery(listAllProductsBySupplier);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { listAllProducts, listProductsBySupplier, listAllProductsByCustomer }