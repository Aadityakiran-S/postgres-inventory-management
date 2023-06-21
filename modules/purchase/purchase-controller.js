const executeDBQuery = require('../../helpers/query-execution-helper.js');
const { selectAllFromCustomers } = require('./purchase-queries.json');

const addPurchaseInvoice = async (req, res) => {
    const query = {
        name: "Add purchase inovice to db",
        text: selectAllFromCustomers,
        values: []
    }
    try {
        const queryResult = executeDBQuery(query);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const editPurchaseInvoice = async (req, res) => {
    try {
        const queryResult = executeDBQuery(selectAllFromCustomers);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const deletePurchaseInvoice = async (req, res) => {
    try {
        const queryResult = executeDBQuery(selectAllFromCustomers);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const listAllInvoices = async (req, res) => {
    try {
        const queryResult = executeDBQuery(selectAllFromCustomers);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { addPurchaseInvoice, editPurchaseInvoice, listAllInvoices, deletePurchaseInvoice }