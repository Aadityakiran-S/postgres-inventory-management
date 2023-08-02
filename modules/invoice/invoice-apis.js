const executeDBQuery = require('../../helpers/query-execution-helper.js');

//#region  CRUD on invoice
const addInvoice = async ({ body }, res) => {
    try {
        //Check if supplier with given name exists. if not, then add that to supplier table
        const s_id = await checkSupplierNameExists(body.invoice.supplier_name);
        body.invoice.supplier_id = s_id;

        //Adding invoice
        let query = {
            name: `inserting into invoice`,
            text: `INSERT INTO invoice (date, total_price, supplier_id, customer_id) VALUES ($1, $2, $3, $4) RETURNING invoice_id;`,
            values: [body.invoice.date, body.invoice.total_price, body.invoice.supplier_id, body.invoice.customer_id]
        }
        const queryResult = await executeDBQuery(query);

        await addInvoiceItemsAndUpdateProductStock(body.invoice.items, body.invoice.date, queryResult.rows[0].invoice_id, s_id, body.invoice.customer_id);
        //Add supplier_product mapping for every new supplier_product combo
        await createSupplierProductMapping(body.invoice.items, s_id);

        return res.status(201).json({ success: true, data: queryResult.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ success: false, msg: error.message });
    }
}

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
//#endregion

//#region Helper Functions
const addInvoiceItemsAndUpdateProductStock = async (items, date, invoice_id, supplier_id, customer_id) => {
    for (const item of items) {
        //Getting product_id from product_name: IF product not listed, listing it
        const p_id = await retrieveProductID(item.product_name);
        item.product_id = p_id; //Adding product_id filed

        //Adding invoice items
        let query1 = {
            name: `inserting int inovice_item`,
            text: `INSERT INTO invoice_item (invoice_id, date, product_id, quantity, unit_price, sub_total_price, supplier_id, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING invoice_item_id;`,
            values: [invoice_id, date, p_id, item.quantity, item.unit_price, item.sub_total_price, supplier_id, customer_id]
        }
        var res1 = await executeDBQuery(query1);

        //Add to product_stock table
        await updateProductStockTable(item, p_id, customer_id, supplier_id, date, res1.rows[0].invoice_item_id);
    }
}

const updateProductStockTable = async (item, product_id, customer_id, supplier_id, date, invoice_item_id) => {
    //Checking if entry exists with given product_id and customer_id
    let query1 = {
        name: `Checking if entry exists with given product_id and customer_id`,
        text: `SELECT EXISTS (SELECT 1 FROM product_stock WHERE product_id = $1 AND customer_id = $2);`,
        values: [product_id, customer_id]
    }
    var res1 = await executeDBQuery(query1);

    //If stock entry exists, simply add the value of quantity for each item
    if (res1.rows[0].exists) {
        let query2 = {
            name: `Updating product stock for given product_id and customer_id`,
            text: `UPDATE product_stock 
            SET 
            current_quantity = current_quantity + $1,
            supplier_id = $2,
            date = $3,
            invoice_item_id = $4
            WHERE product_id = $5 AND customer_id = $6;`,
            values: [item.quantity, supplier_id, date, invoice_item_id, product_id, customer_id]
        }
        var res2 = await executeDBQuery(query2);
    } else { //If not, create and set intial value of stock to what item has at this point
        let query3 = {
            name: `Creating a new product_stock table entry`,
            text: `INSERT INTO product_stock
            (product_id, customer_id, supplier_id, current_quantity, invoice_item_id, date) 
            VALUES ($1, $2, $3, $4, $5, $6);`,
            values: [product_id, customer_id, supplier_id, item.quantity, invoice_item_id, date]
        }
        var res3 = await executeDBQuery(query3);
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

const checkSupplierNameExists = async (supplierName) => {
    //Checking if supplier with given name exists
    let query = {
        name: `Checking if supplier with given name exists`,
        text: `SELECT EXISTS (SELECT 1 FROM supplier WHERE supplier_name = $1);`,
        values: [supplierName]
    }
    const res1 = await executeDBQuery(query); var supplierID;
    if (res1.rows[0].exists) { //If exists, return that's supplier ID
        let query = {
            name: `Getting ID of the given supplier`,
            text: `SELECT supplier_id FROM supplier WHERE supplier_name = $1;`,
            values: [supplierName]
        }
        const res2 = await executeDBQuery(query);
        supplierID = res2.rows[0].supplier_id;
    } else { //Else, create one and return newly created supplierID
        let query = {
            name: `Creating a new supplier with given name and returning its ID`,
            text: `INSERT INTO supplier (supplier_name) VALUES ($1) RETURNING supplier_id;`,
            values: [supplierName]
        }
        const res2 = await executeDBQuery(query);
        supplierID = res2.rows[0].supplier_id;
    }
    return supplierID;
}

const createSupplierProductMapping = async (items, s_id) => {
    for (const item of items) {
        //Checking S-P mapping if exists
        let query = {
            name: `Checking if supplier_product mapping exists`,
            text: `SELECT EXISTS (SELECT 1 FROM supplier_product WHERE supplier_id = $1 AND product_id = $2);`,
            values: [s_id, item.product_id]
        }
        const res1 = await executeDBQuery(query);
        //If exists, leave alone, if not we need to create a new mapping
        if (!res1.rows[0].exists) {
            let query = {
                name: `Creating new supplier_product mapping`,
                text: `INSERT INTO supplier_product (supplier_id, product_id) VALUES ($1, $2);`,
                values: [s_id, item.product_id]
            }
            const res2 = await executeDBQuery(query);
        }
    }
}
//#endregion

module.exports = {
    addInvoice,
    editInvoice, editInvoiceItem,
    listAllInvoices, listInvoiceItems,
    deleteInvoice, deleteInvoiceItem
}