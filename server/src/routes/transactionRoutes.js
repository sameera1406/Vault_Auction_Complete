const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middlewares/auth');

router.get('/dashboard', protect, transactionController.getUserTransactions);
router.post('/seller/accept', protect, transactionController.sellerAccept);
router.post('/seller/reject', protect, transactionController.sellerReject);
router.post('/buyer/confirm', protect, transactionController.buyerConfirm);
router.post('/buyer/refuse', protect, transactionController.buyerRefuse);

module.exports = router;
