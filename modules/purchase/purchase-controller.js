const executeDBQuery = require('../../helpers/query-execution-helper.js');

//#DONE
const addInvoice = async ({ body }, res) => {
    try {
        let query = {
            name: `inserting into invoice`,
            text: `INSERT INTO invoice (date, total_price) VALUES ($1, $2) RETURNING invoice_id;`,
            values: [body.invoice.date, body.invoice.total_price]
        }
        const queryResult = await executeDBQuery(query);
        await addInvoiceItems(body.invoice.items, body.invoice.date, queryResult.rows[0].invoice_id);
        return res.status(201).json({ success: true, data: queryResult.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#DONE
const editInvoice = async (req, res) => {
    let { id: invoiceID } = req.params;
    let body = req.body.invoice;
    try {
        //#region Check if Invoice with ID given exists
        let checkIfInvoiceExists = {
            name: `Check if invoice with ID: ${invoiceID}`,
            text: `SELECT EXISTS (SELECT 1 FROM invoice WHERE invoice_id = $1);`,
            values: [invoiceID]
        }
        const checkInvoiceExistsResult = await executeDBQuery(checkIfInvoiceExists);
        const doesInvoiceExist = checkInvoiceExistsResult.rows[0].exists;
        if (!doesInvoiceExist) {
            return res.status(201).json({
                success: false,
                message: `Invoice with ID ${invoiceID} DNE`
            });
        }
        //#endregion

        //Updating invoice
        let updateInvoice = {
            name: `Update invoice entry with invoiceID: ${invoiceID}`,
            text: `UPDATE invoice SET date = $1 WHERE invoice_id = $2;`,
            values: [body.date, invoiceID] //Add new fileds here later
        }
        const queryResult = await executeDBQuery(updateInvoice)
        return res.status(201).json({ success: true, data: queryResult.rows[0] })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

const editInvoiceItem = async (req, res) => {
    let { id: invoiceItemID } = req.params;
    let body = req.body.invoiceItem;
    try {
        //#region Check if InvoiceItem with ID given exists
        let checkInvoiceItemExists = {
            name: `Check if invoice_item with ID: ${invoiceItemID}`,
            text: `SELECT EXISTS (SELECT 1 FROM invoice_item WHERE invoice_item_id = $1);`,
            values: [invoiceItemID]
        }
        const checkInvoiceItemExistsRes = await executeDBQuery(checkInvoiceItemExists);
        const doesInvoiceExist = checkInvoiceItemExistsRes.rows[0].exists;
        if (!doesInvoiceExist) {
            return res.status(201).json({
                success: false,
                message: `Invoice_item with ID ${invoiceItemID} DNE`
            });
        }
        //#endregion

        //Get current invoice_item
        let getInvoiceItem = {
            name: `Get inovice_item with Inovice_item_id: ${invoiceItemID}`,
            text: `SELECT invoice_id, sub_total_price FROM invoice_item WHERE invoice_item_id = $1;`,
            values: [invoiceItemID] //Add new fileds here later
        }
        const getInvoiceItemResult = await executeDBQuery(getInvoiceItem);
        const currentInvoiceItem = getInvoiceItemResult.rows[0];

        //Update in parent invoice if there's a change in price
        if (currentInvoiceItem.sub_total_price != body.sub_total_price) {
            console.log(currentInvoiceItem.invoice_id);
            let updateInvoice = {
                name: `Update invoice with invoice_id: ${currentInvoiceItem.invoice_id}`,
                text: `UPDATE invoice SET total_price = total_price + $1 WHERE invoice_id = $2;`,
                values: [body.sub_total_price - currentInvoiceItem.sub_total_price, currentInvoiceItem.invoice_id]
            }
            const updateInvoiceResult = await executeDBQuery(updateInvoice);
            console.log(body.sub_total_price - currentInvoiceItem.sub_total_price);
        }

        //#TODO: Update the product_id if there's a change in name

        //Update current InvoiceItem
        let updateInvoiceItem = {
            name: `Update inovice_item with Inovice_item_id: ${invoiceItemID}`,
            text: `UPDATE invoice_item SET product_id = $1, unit_price = $2, 
            quantity = $3, sub_total_price = $4 WHERE invoice_item_id = $5;`,
            values: [body.product_id, body.unit_price, body.quantity, body.sub_total_price, invoiceItemID] //Add new fileds here later
        }
        const updateInvoiceItemResult = await executeDBQuery(updateInvoiceItem);
        return res.status(201).json({ success: true, data: updateInvoiceItemResult.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#DONE
const deleteInvoice = async (req, res) => {
    let { id: invoiceID } = req.params;
    try {
        //#region Check if Invoice with ID given exists
        let checkIfInvoiceExists = {
            name: `Check if invoice with ID: ${invoiceID}`,
            text: `SELECT EXISTS (SELECT 1 FROM invoice WHERE invoice_id = $1);`,
            values: [invoiceID]
        }
        const checkInvoiceExistsResult = await executeDBQuery(checkIfInvoiceExists);
        const doesInvoiceExist = checkInvoiceExistsResult.rows[0].exists;
        if (!doesInvoiceExist) {
            return res.status(201).json({
                success: false,
                message: `Invoice with ID ${invoiceID} DNE`
            });
        }
        //#endregion

        //Deleting invoice Items
        let deleteInvoiceItems = {
            name: `Delete all invoiceItems with invoiceID: ${invoiceID}`,
            text: `DELETE FROM invoice_item WHERE invoice_id = $1;`,
            values: [invoiceID]
        }
        const deleteInvoiceItemsResult = await executeDBQuery(deleteInvoiceItems);

        //Deleting invoice
        let deleteInvoice = {
            name: `Delete invoice with ID: ${invoiceID}`,
            text: `DELETE FROM invoice WHERE invoice_id = $1;`,
            values: [invoiceID]
        }
        const deleteInvoiceResult = await executeDBQuery(deleteInvoice);

        return res.status(201).json({
            success: true
        })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#DONE
const deleteInvoiceItem = async (req, res) => {
    let { id: invoiceItemID } = req.params;
    try {
        //#region Checking if Invoice_Item to be deleted exists
        let checkIfInvoiceItemExists = {
            name: `Check if invoice_item with ID: ${invoiceItemID}`,
            text: `SELECT EXISTS (SELECT 1 FROM invoice_item WHERE invoice_item_id = $1);`,
            values: [invoiceItemID]
        }
        const checkIfInvoiceItemExistsResult = await executeDBQuery(checkIfInvoiceItemExists);
        const doesInvoiceItemExist = checkIfInvoiceItemExistsResult.rows[0].exists;
        if (!doesInvoiceItemExist) {
            return res.status(201).json({
                success: false,
                message: `invoice_item with ID ${invoiceID} DNE`
            });
        }
        //#endregion

        //#region Getting invoice from which this invoiceItem came from
        let getInvoice = {
            name: `Get Invoice ID of invoiceItem with ID: ${invoiceItemID}`,
            text: `SELECT invoice_id, sub_total_price FROM invoice_item WHERE invoice_item_id = $1;`,
            values: [invoiceItemID]
        }
        const getInvoiceResult = await executeDBQuery(getInvoice);
        const invoiceIDAndSubtotal = getInvoiceResult.rows[0];
        //#endregion

        //#region Deleting the invoice_item and updating total_price of invoice
        //Deleting invoice_item
        let deleteInvoiceItem = {
            name: `Delete invoiceItem with ID: ${invoiceItemID}`,
            text: `DELETE FROM invoice_item WHERE invoice_item_id = $1`,
            values: [invoiceItemID]
        }
        const deleteInvoiceItemResult = await executeDBQuery(deleteInvoiceItem);

        //Update invoice by decreasing total price
        let updateInvoice = {
            name: `Update invoice with ID: ${invoiceIDAndSubtotal.invoice_id}`,
            text: `UPDATE invoice SET total_price = total_price - $1 WHERE invoice_id = $2`,
            values: [invoiceIDAndSubtotal.sub_total_price, invoiceIDAndSubtotal.invoice_id]
        }
        const updateInvoiceResult = await executeDBQuery(updateInvoice);
        //#endregion

        return res.status(201).json({
            success: true
        })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#DONE
const listAllInvoices = async (req, res) => {
    try {
        let listAllInvoices = {
            name: `List all invoices`,
            text: `SELECT * FROM invoice`,
        }
        const queryResult = await executeDBQuery(listAllInvoices);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#DONE
const listInvoiceItems = async (req, res) => {
    let { id: invoiceID } = req.params;
    try {
        let listInvoiceItems = {
            name: `List all invoice_items belonging to invoice with ID ${invoiceID}`,
            text: `SELECT * FROM invoice_item WHERE invoice_id = $1`,
            values: [invoiceID]
        }
        const queryResult = await executeDBQuery(listInvoiceItems);
        return res.status(201).json({ success: true, data: queryResult.rows })
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

//#region Helper Functions
const addInvoiceItems = async (items, date, invoice_id) => {
    //#TODO: Implement the below things
    for (const item of items) {
        const p_id = await retrieveProductID(item.product_name);
        item.product_id = p_id; //Adding product_id filed
    }
    console.log("Hello");
    for (const item of items) {
        let query = {
            name: `inserting int inovice_item`,
            text: `INSERT INTO invoice_item (invoice_id, date, product_id, quantity, unit_price, sub_total_price) VALUES ($1, $2, $3, $4, $5, $6);`,
            values: [invoice_id, date, item.product_id, item.quantity, item.unit_price, item.sub_total_price]
        }
        await executeDBQuery(query);
    }
}

const retrieveProductID = async (product_name) => {
    //#region Checking if product with given name exists
    let query = {
        name: `Checking if product with given name exists`,
        text: `SELECT EXISTS (SELECT 1 FROM product WHERE product_name = $1);`,
        values: [product_name]
    }
    const queryResult = await executeDBQuery(query);
    //#endregion

    const doesInvoiceItemExist = queryResult.rows[0].exists; let prdQueryRes;
    if (!doesInvoiceItemExist) {
        //Create one
        let query = {
            name: `Creating a product with the given name in product table`,
            text: `INSERT INTO product (product_name) VALUES ($1) RETURNING product_id;`,
            values: [product_name]
        }
        prdQueryRes = await executeDBQuery(query);
    } else {
        //Get it's ID
        let query = {
            name: `Getting ID of already existing product`,
            text: `SELECT product_id FROM product WHERE product_name = $1;`,
            values: [product_name]
        }
        prdQueryRes = await executeDBQuery(query);
    }
    return prdQueryRes.rows[0].product_id;
}
//#endregion

module.exports = {
    addInvoice,
    editInvoice, editInvoiceItem,
    listAllInvoices, listInvoiceItems,
    deleteInvoice, deleteInvoiceItem
}