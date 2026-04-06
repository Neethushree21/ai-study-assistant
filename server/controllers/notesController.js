const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const { extractText } = require('../utils/textExtractor');

// ─── @route  POST /api/notes/upload ───────────────────────────────────────────
// @desc   Upload a note file (PDF or txt), extract text, save to DB
// @access Private
const uploadNote = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Note title is required.' });
    }

    let extractedText = '';
    let originalFileName = '';
    let filePath = '';
    let fileType = 'txt';

    if (req.file) {
      // File was uploaded — extract text from it
      filePath = req.file.path;
      originalFileName = req.file.originalname;
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      fileType = ext === 'pdf' ? 'pdf' : 'txt';

      extractedText = await extractText(filePath);
      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(422).json({
          success: false,
          message: 'Could not extract meaningful text from the uploaded file.',
        });
      }
    } else if (req.body.textContent) {
      // Raw text was pasted in
      extractedText = req.body.textContent;
      fileType = 'text';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file or provide text content.',
      });
    }

    const wordCount = extractedText.trim().split(/\s+/).length;

    const note = await Note.create({
      user: req.user._id,
      title,
      originalFileName,
      filePath,
      fileType,
      extractedText: extractedText.trim(),
      wordCount,
    });

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully!',
      note: {
        id: note._id,
        title: note.title,
        wordCount: note.wordCount,
        fileType: note.fileType,
        originalFileName: note.originalFileName,
        isSummarized: note.isSummarized,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/notes ────────────────────────────────────────────────────
// @desc   Get all notes for the authenticated user
// @access Private
const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id })
      .select('-extractedText -filePath') // Exclude large fields from list
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/notes/:id ───────────────────────────────────────────────
// @desc   Get a single note with full text and summary
// @access Private
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/notes/:id ────────────────────────────────────────────
// @desc   Delete a note
// @access Private
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Remove physical file if it exists
    if (note.filePath && fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }

    await note.deleteOne();

    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadNote, getNotes, getNoteById, deleteNote };
