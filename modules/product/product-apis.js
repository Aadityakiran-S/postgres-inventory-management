const executeDBQuery = require('../../helpers/query-execution-helper.js');

const listAllProducts = async (req, res) => {
    try {
        let listAllInvoices = {
            name: `List all products`,
            text: `SELECT * FROM product`,
        }
        const queryResult = await executeDBQuery(listAllInvoices);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { listAllProducts }