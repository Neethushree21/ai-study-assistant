const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');

// ─── @route  POST /api/progress ────────────────────────────────────────────────
// @desc   Save a quiz attempt result
// @access Private
const saveProgress = async (req, res, next) => {
  try {
    const { quizId, noteId, score, totalQuestions, answers } = req.body;

    if (!quizId || !noteId || score === undefined || !totalQuestions) {
      return res.status(400).json({ success: false, message: 'Missing required progress fields.' });
    }

    const percentage = Math.round((score / totalQuestions) * 100);

    const progress = await Progress.create({
      user: req.user._id,
      quiz: quizId,
      note: noteId,
      score,
      totalQuestions,
      percentage,
      answers: answers || [],
    });

    res.status(201).json({
      success: true,
      message: 'Progress saved!',
      progress: {
        id: progress._id,
        score,
        totalQuestions,
        percentage,
        completedAt: progress.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/progress ─────────────────────────────────────────────────
// @desc   Get all progress records for the user
// @access Private
const getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find({ user: req.user._id })
      .populate('quiz', 'title totalQuestions')
      .populate('note', 'title')
      .sort({ completedAt: -1 })
      .limit(50); // Last 50 attempts

    res.json({ success: true, count: progress.length, progress });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/progress/stats ──────────────────────────────────────────
// @desc   Get aggregated stats for dashboard
// @access Private
const getStats = async (req, res, next) => {
  try {
    const allProgress = await Progress.find({ user: req.user._id });

    if (allProgress.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalQuizzesTaken: 0,
          averageScore: 0,
          bestScore: 0,
          totalQuestionsAnswered: 0,
          totalCorrect: 0,
          accuracyRate: 0,
          recentScores: [],
        },
      });
    }

    const totalQuizzesTaken = allProgress.length;
    const totalQuestionsAnswered = allProgress.reduce((sum, p) => sum + p.totalQuestions, 0);
    const totalCorrect = allProgress.reduce((sum, p) => sum + p.score, 0);
    const averageScore = Math.round(
      allProgress.reduce((sum, p) => sum + p.percentage, 0) / totalQuizzesTaken
    );
    const bestScore = Math.max(...allProgress.map((p) => p.percentage));
    const accuracyRate = Math.round((totalCorrect / totalQuestionsAnswered) * 100);

    // Last 7 quiz scores for chart
    const recentProgress = await Progress.find({ user: req.user._id })
      .populate('quiz', 'title')
      .sort({ completedAt: -1 })
      .limit(7);

    const recentScores = recentProgress
      .reverse()
      .map((p) => ({
        quizTitle: p.quiz?.title || 'Quiz',
        score: p.percentage,
        date: p.completedAt,
      }));

    res.json({
      success: true,
      stats: {
        totalQuizzesTaken,
        averageScore,
        bestScore,
        totalQuestionsAnswered,
        totalCorrect,
        accuracyRate,
        recentScores,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveProgress, getProgress, getStats };
