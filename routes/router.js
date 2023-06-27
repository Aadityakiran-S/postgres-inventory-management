const express = require('express');
const router = express.Router();
const { addInvoice, editInvoice, deleteInvoice, listAllInvoices, deleteInvoiceItem, listInvoiceItems } = require('../modules/purchase/purchase-controller');

//For now, putting all purchase routes here. Can move to it's own folder if it gets too crowded
router.route('/').post(addInvoice);

router.route('/').get(listAllInvoices);
router.route('/:id').get(listInvoiceItems);

router.route('/:id').patch(editInvoice);

router.route('/invoice/:id').delete(deleteInvoice);
router.route('/invoice_item/:id').delete(deleteInvoiceItem);

module.exports = router;