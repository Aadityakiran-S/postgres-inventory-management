const executeDBQuery = require('../../helpers/query-execution-helper.js');
const { selectAllItemsFromInvoice } = require('./purchase-queries.json');

let query = {
    name: `Give suitable name here`,
    text: selectAllItemsFromInvoice,
    values: []
}

//#TOASK: Add validation later?

const addPurchaseInvoice = async ({ body }, res) => {
    console.log(body);
    /*
        1) Add basic details in invoice table
        2) Iterate over internal array to put details in invoice-item table
    */
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
        const queryResult = executeDBQuery(selectAllItemsFromInvoice);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#TOASK: Soft Delete?
const deletePurchaseInvoice = async (req, res) => {
    try {
        const queryResult = executeDBQuery(selectAllItemsFromInvoice);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#TOASK: Add Pagination later? 
const listAllInvoices = async (req, res) => {
    try {
        const queryResult = executeDBQuery(selectAllItemsFromInvoice);
        return res.status(201).json({ success: true, data: queryResult })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

module.exports = { addPurchaseInvoice, editPurchaseInvoice, listAllInvoices, deletePurchaseInvoice }