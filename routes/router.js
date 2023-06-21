const express = require('express');
const router = express.Router();
const { addPurchaseInvoice, editPurchaseInvoice, deletePurchaseInvoice, listAllInvoices } = require('../modules/purchase/purchase-controller');

//For now, putting all purchase routes here. Can move to it's own folder if it gets too crowded
router.route('/').get(listAllInvoices);
router.route('/').post(addPurchaseInvoice);
router.route('/').patch(editPurchaseInvoice);
router.route('/').delete(deletePurchaseInvoice);

module.exports = router;