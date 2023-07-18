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

}

module.exports = { listAllProducts, listProductsBySupplier }