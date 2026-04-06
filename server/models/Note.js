const mongoose = require('mongoose');

/**
 * Note Schema
 * Stores uploaded study notes with extracted text and AI-generated summary.
 */
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // Original file info
    originalFileName: {
      type: String,
      default: '',
    },
    filePath: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'text'],
      default: 'txt',
    },
    // Extracted and processed content
    extractedText: {
      type: String,
      required: [true, 'Extracted text is required'],
    },
    summary: {
      type: String,
      default: '',
    },
    // Metadata
    wordCount: {
      type: Number,
      default: 0,
    },
    isSummarized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
