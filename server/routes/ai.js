const express = require('express');
const router = express.Router();
const {
  summarizeNote,
  generateQuizFromNote,
  getQuiz,
  submitQuiz,
  getUserQuizzes,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// POST /api/ai/summarize — generate summary for a note
router.post('/summarize', summarizeNote);

// POST /api/ai/generate-quiz — generate quiz for a note
router.post('/generate-quiz', generateQuizFromNote);

// GET /api/ai/quizzes — get all quizzes for current user
router.get('/quizzes', getUserQuizzes);

// GET /api/ai/quiz/:quizId — get a specific quiz (no answers)
router.get('/quiz/:quizId', getQuiz);

// POST /api/ai/quiz/:quizId/submit — submit quiz answers
router.post('/quiz/:quizId/submit', submitQuiz);

module.exports = router;
