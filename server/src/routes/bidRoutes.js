const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, bidController.placeBid);

module.exports = router;
