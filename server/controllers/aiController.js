const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const { summarize, generateQuiz } = require('../utils/aiEngine');

// ─── @route  POST /api/ai/summarize ───────────────────────────────────────────
// @desc   Generate a summary for a note
// @access Private
const summarizeNote = async (req, res, next) => {
  try {
    const { noteId } = req.body;

    if (!noteId) {
      return res.status(400).json({ success: false, message: 'noteId is required.' });
    }

    const note = await Note.findOne({ _id: noteId, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Generate summary using the AI engine
    const summary = summarize(note.extractedText, 6);

    // Save summary back to the note
    note.summary = summary;
    note.isSummarized = true;
    await note.save();

    res.json({
      success: true,
      message: 'Summary generated successfully!',
      summary,
      noteId: note._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/ai/generate-quiz ───────────────────────────────────────
// @desc   Generate a quiz (MCQs) from a note
// @access Private
const generateQuizFromNote = async (req, res, next) => {
  try {
    const { noteId, questionCount = 5 } = req.body;

    if (!noteId) {
      return res.status(400).json({ success: false, message: 'noteId is required.' });
    }

    const note = await Note.findOne({ _id: noteId, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (note.extractedText.split(/\s+/).length < 50) {
      return res.status(422).json({
        success: false,
        message: 'Note text is too short to generate a quiz. Please provide more content.',
      });
    }

    // Generate MCQ questions using AI engine
    const questions = generateQuiz(note.extractedText, Math.min(questionCount, 10));

    if (!questions || questions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Could not generate quiz questions from this content. Try uploading more detailed notes.',
      });
    }

    // Save the quiz to database
    const quiz = await Quiz.create({
      user: req.user._id,
      note: note._id,
      title: `Quiz: ${note.title}`,
      questions,
    });

    res.status(201).json({
      success: true,
      message: `Quiz with ${questions.length} questions generated!`,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions,
        noteId: note._id,
        noteTitle: note.title,
        questions: quiz.questions.map((q, idx) => ({
          index: idx,
          question: q.question,
          options: q.options,
          // We don't send the correct answer index to the client during quiz
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/ai/quiz/:quizId ─────────────────────────────────────────
// @desc   Fetch a quiz by ID (without correct answers)
// @access Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user._id }).populate(
      'note',
      'title'
    );

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions,
        noteTitle: quiz.note?.title,
        noteId: quiz.note?._id,
        questions: quiz.questions.map((q, idx) => ({
          index: idx,
          question: q.question,
          options: q.options,
          // correctAnswer intentionally excluded for quiz-taking
        })),
        createdAt: quiz.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/ai/quiz/:quizId/submit ─────────────────────────────────
// @desc   Submit quiz answers and get results with correct answers
// @access Private
const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of selected option indices

    const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Please answer all ${quiz.questions.length} questions.`,
      });
    }

    // Grade the quiz
    let score = 0;
    const gradedAnswers = quiz.questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
      if (isCorrect) score++;
      return {
        questionIndex: idx,
        question: q.question,
        selectedAnswer: answers[idx],
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        options: q.options,
      };
    });

    const percentage = Math.round((score / quiz.totalQuestions) * 100);

    res.json({
      success: true,
      results: {
        quizId: quiz._id,
        score,
        totalQuestions: quiz.totalQuestions,
        percentage,
        answers: gradedAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/ai/quizzes ──────────────────────────────────────────────
// @desc   Get all quizzes for the current user
// @access Private
const getUserQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id })
      .populate('note', 'title')
      .select('-questions')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    next(error);
  }
};

module.exports = { summarizeNote, generateQuizFromNote, getQuiz, submitQuiz, getUserQuizzes };
