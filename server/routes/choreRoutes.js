const express = require('express');
const router = express.Router();
const { getChores, createChore, deleteChore, generateAssignments, getTodayAssignments, completeAssignment } = require('../controllers/choreController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', getChores);
router.post('/', createChore);
router.post('/generate', generateAssignments);
router.get('/today', getTodayAssignments);
router.patch('/assign/:id/complete', completeAssignment);
router.delete('/:id', deleteChore);

module.exports = router;