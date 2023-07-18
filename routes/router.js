const express = require('express');
const router = express.Router();

//#region Invoice
const {
    addInvoice,
    editInvoice, editInvoiceItem,
    listAllInvoices, listInvoiceItems,
    deleteInvoiceItem, deleteInvoice
} = require('../modules/invoice/invoice-apis');

//APIs
router.route('/invoice').post(addInvoice);

router.route('/invoice').get(listAllInvoices);
router.route('/invoice_item/:id').get(listInvoiceItems);

router.route('/invoice/:id').patch(editInvoice);
router.route('/invoice_item/:id').patch(editInvoiceItem);

router.route('/invoice/:id').delete(deleteInvoice);
router.route('/invoice_item/:id').delete(deleteInvoiceItem);
//#endregion

//#region Product
const {
    listAllProducts
} = require('../modules/product/product-apis');

//APIs
router.route('/product').get(listAllProducts);
//#endregion

//#region Price Tracking
const { findMinPriceBtweenTwoDates } = require('../modules/price-tracking/price-tracking-apis');

//APIs
router.route('/price_tracking').get(findMinPriceBtweenTwoDates);
//#endregion

module.exports = router;