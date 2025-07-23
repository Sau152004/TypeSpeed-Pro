const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { testResultValidation, paginationValidation, idValidation } = require('../middleware/validation');
const testController = require('../controllers/testController');

const router = express.Router();

// Save test result
router.post('/save', requireAuth, testResultValidation, testController.saveResult);

// Get test history
router.get('/history', requireAuth, paginationValidation, testController.getHistory);

// Get test statistics
router.get('/stats', requireAuth, testController.getTestStats);

// Delete specific test result
router.delete('/:id', requireAuth, idValidation, testController.deleteResult);

module.exports = router;