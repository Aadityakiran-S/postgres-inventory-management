const executeDBQuery = require('../../helpers/query-execution-helper.js');
const { selectAllItemsFromInvoice, addInvoice, addInvoiceItem } = require('./purchase-queries.json');

let query = {
    name: `Give suitable name here`,
    text: selectAllItemsFromInvoice,
    values: []
}

const addPurchaseInvoice = async ({ body }, res) => {
    try {
        let invoiceInsertQuery = {
            name: `inserting into invoice`,
            text: addInvoice,
            values: [body.invoice.date, body.invoice.total_price]
        }
        const invoiceInsertQueryResult = await executeDBQuery(invoiceInsertQuery);
        console.log(invoiceInsertQueryResult.rows[0].invoice_id);
        await processItems(body.invoice.items, body.invoice.date, invoiceInsertQueryResult.rows[0].invoice_id);
        return res.status(201).json({ success: true, data: invoiceInsertQueryResult.rows });
        //#TOASK: What would be a proper return here? Info about the succeess of all individual query responses or just the main one?
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

//#region Helper Functions
const processItems = async (items, date, invoice_id) => {
    for (const item of items) {
        let insertInvoiceItemQuery = {
            name: `inserting int inovice_item`,
            text: addInvoiceItem,
            values: [invoice_id, date, item.product_id, item.quantity, item.unit_price, item.sub_total_price]
        }
        await executeDBQuery(insertInvoiceItemQuery);
    }
}
//#endregion

module.exports = { addPurchaseInvoice, editPurchaseInvoice, listAllInvoices, deletePurchaseInvoice }