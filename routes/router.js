const express = require('express');
const router = express.Router();
const {
    addInvoice,
    editInvoice, editInvoiceItem,
    listAllInvoices, listInvoiceItems,
    deleteInvoiceItem, deleteInvoice
} = require('../modules/purchase/purchase-controller');

//For now, putting all purchase routes here. Can move to it's own folder if it gets too crowded
router.route('/').post(addInvoice); //#TOASK: Should we enable an option to POST invoice_item only as well?

router.route('/invoice').get(listAllInvoices);
router.route('/invoice_item/:id').get(listInvoiceItems);

router.route('/invoice/:id').patch(editInvoice);
router.route('/invoice_item/:id').patch(editInvoiceItem);

router.route('/invoice/:id').delete(deleteInvoice);
router.route('/invoice_item/:id').delete(deleteInvoiceItem);

module.exports = router;