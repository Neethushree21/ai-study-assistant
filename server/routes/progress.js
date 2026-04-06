const express = require('express');
const router = express.Router();
const { saveProgress, getProgress, getStats } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// POST /api/progress — save a quiz result
router.post('/', saveProgress);

// GET /api/progress — get all progress records
router.get('/', getProgress);

// GET /api/progress/stats — get aggregated dashboard stats
router.get('/stats', getStats);

module.exports = router;
