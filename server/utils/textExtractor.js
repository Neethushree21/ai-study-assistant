const fs = require('fs');
const path = require('path');

/**
 * Text Extractor Utility
 * Extracts plain text from uploaded PDF or .txt files.
 */

/**
 * Extract text from a .txt file
 * @param {string} filePath - Absolute path to the file
 * @returns {string} - File contents as a string
 */
const extractFromTxt = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

/**
 * Extract text from a PDF file using pdf-parse
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractFromPdf = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    throw new Error('Failed to extract text from PDF. File may be corrupted or encrypted.');
  }
};

/**
 * Main extractor function — detects file type and extracts accordingly
 * @param {string} filePath - Absolute path to the uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return await extractFromPdf(filePath);
  } else if (ext === '.txt') {
    return extractFromTxt(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Only PDF and .txt are supported.`);
  }
};

module.exports = { extractText };
