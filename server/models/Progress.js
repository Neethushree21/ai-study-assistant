const mongoose = require('mongoose');

/**
 * Progress Schema
 * Tracks user quiz attempts and scores for progress analytics.
 */
const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
    },
    // Quiz result details
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Detailed answers submitted by user
    answers: [
      {
        questionIndex: { type: Number, required: true },
        selectedAnswer: { type: Number, required: true }, // index of chosen option
        isCorrect: { type: Boolean, required: true },
      },
    ],
    // Completion timestamp
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
