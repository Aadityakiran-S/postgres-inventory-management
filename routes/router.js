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
    listAllProducts, listProductsBySupplier, listAllProductsByCustomer, listAllProductsByCustomerAndSupplier
} = require('../modules/product/product-apis');

//APIs
router.route('/product').get(listAllProducts);
router.route('/product/supplier/:id').get(listProductsBySupplier);
router.route('/product/customer/:id').get(listAllProductsByCustomer);
router.route('/product/customer_supplier').get(listAllProductsByCustomerAndSupplier);
//#endregion

//#region Price Tracking
const { findMinPriceBetweenTwoDates, findMinPriceBetweenTwoDates_FuzzySearch, customerProductPriceTracking } = require('../modules/price-tracking/price-tracking-apis');

//APIs
router.route('/price_tracking').get(findMinPriceBetweenTwoDates);
router.route('/price_tracking/fuzzy_search').get(findMinPriceBetweenTwoDates_FuzzySearch);
router.route('/price_tracking/customer_product').get(customerProductPriceTracking);
//#endregion

module.exports = router;