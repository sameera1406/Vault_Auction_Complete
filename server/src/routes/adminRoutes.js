const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/stats', protect, adminOnly, adminController.getAdminStats);
router.delete('/auction/:id', protect, adminOnly, adminController.deleteAuction);
router.delete('/user/:id', protect, adminOnly, adminController.deleteUser);

module.exports = router;
