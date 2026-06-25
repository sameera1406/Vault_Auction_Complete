const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Create Item route with multipart/form-data upload and custom error handling
router.post('/', protect, (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('[Multer Error]:', err.message);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, itemController.createItem);

router.get('/queue', itemController.getLiveQueue);
router.get('/details/:id', itemController.getAuctionDetails);

module.exports = router;
