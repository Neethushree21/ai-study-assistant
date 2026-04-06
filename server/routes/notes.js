const express = require('express');
const router = express.Router();
const { uploadNote, getNotes, getNoteById, deleteNote } = require('../controllers/notesController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// POST /api/notes/upload — upload a file or paste text
router.post('/upload', upload.single('file'), uploadNote);

// GET /api/notes — get all notes for user
router.get('/', getNotes);

// GET /api/notes/:id — get single note
router.get('/:id', getNoteById);

// DELETE /api/notes/:id — delete a note
router.delete('/:id', deleteNote);

module.exports = router;
