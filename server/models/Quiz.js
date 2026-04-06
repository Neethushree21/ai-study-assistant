const mongoose = require('mongoose');

/**
 * Quiz Schema
 * Stores AI-generated MCQ quizzes linked to study notes.
 */
const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Array of MCQ questions
    questions: [
      {
        question: { type: String, required: true },
        options: {
          type: [String],
          validate: {
            validator: (arr) => arr.length === 4,
            message: 'Each question must have exactly 4 options',
          },
        },
        correctAnswer: { type: Number, required: true, min: 0, max: 3 }, // index of correct option
        explanation: { type: String, default: '' },
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-set totalQuestions before saving
quizSchema.pre('save', function (next) {
  this.totalQuestions = this.questions.length;
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
