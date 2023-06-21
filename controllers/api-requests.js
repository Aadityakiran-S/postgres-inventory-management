const executeDBQuery = require('../helpers/query-execution-helper.js');
require('dotenv').config();

const getData = async (req, res) => {
    try {
        const queryResult = executeDBQuery("SELECT * FROM customer")
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { getData }