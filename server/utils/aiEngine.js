/**
 * AI Engine Utility
 * Provides mock AI-powered summarization and quiz generation.
 * Uses extractive NLP techniques (TF-IDF inspired keyword scoring).
 * Can be swapped out for OpenAI / Gemini by replacing these functions.
 */

// ─── Stop Words ───────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was',
  'were','be','been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','shall','can','need','dare',
  'ought','used','it','its','this','that','these','those','i','we','you',
  'he','she','they','what','which','who','whom','when','where','why','how',
  'all','both','each','few','more','most','other','some','such','no','not',
  'only','own','same','so','than','too','very','just','because','as','until',
  'while','although','though','if','then','else','also','after','before',
  'there','here','their','them','they','our','your','his','her',
]);

// ─── Helper: Clean & Tokenize ─────────────────────────────────────────────────
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const getSentences = (text) =>
  text
    .replace(/\s+/g, ' ')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 5); // Only meaningful sentences

// ─── Compute TF-IDF-inspired word scores ─────────────────────────────────────
const scoreWords = (text) => {
  const words = tokenize(text);
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq), 1);
  const scores = {};
  Object.keys(freq).forEach((w) => { scores[w] = freq[w] / maxFreq; });
  return scores;
};

// ─── Score each sentence by its keyword density ───────────────────────────────
const scoreSentences = (sentences, wordScores) =>
  sentences.map((sentence) => {
    const words = tokenize(sentence);
    if (!words.length) return { sentence, score: 0 };
    const score = words.reduce((sum, w) => sum + (wordScores[w] || 0), 0) / words.length;
    return { sentence, score };
  });

// ─── SUMMARIZATION ────────────────────────────────────────────────────────────
/**
 * Generate an extractive summary from text.
 * Picks the top N highest-scoring sentences, then reorders them by appearance.
 * @param {string} text - Input text
 * @param {number} sentenceCount - Number of sentences in summary (default: 5)
 * @returns {string} Summary text
 */
const summarize = (text, sentenceCount = 5) => {
  if (!text || text.trim().length < 100) {
    return text || 'Insufficient text to summarize.';
  }

  const sentences = getSentences(text);
  if (sentences.length <= sentenceCount) return sentences.join('. ') + '.';

  const wordScores = scoreWords(text);
  const scored = scoreSentences(sentences, wordScores);

  // Pick top N by score, then restore original order
  const topIndices = new Set(
    [...scored]
      .map((s, i) => ({ ...s, idx: i }))
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .map((s) => s.idx)
  );

  const summary = sentences
    .filter((_, i) => topIndices.has(i))
    .join('. ')
    .trim();

  return summary + (summary.endsWith('.') ? '' : '.');
};

// ─── QUIZ GENERATION ──────────────────────────────────────────────────────────
/**
 * Extract key concept nouns from text (candidates for quiz questions)
 */
const extractKeyConcepts = (text) => {
  const words = tokenize(text);
  const freq = {};
  words.forEach((w) => { if (w.length > 4) freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
};

/**
 * Find sentences containing a specific concept word
 */
const findSentencesWithWord = (sentences, word) =>
  sentences.filter((s) => s.toLowerCase().includes(word));

/**
 * Generate wrong answer options that are plausible but incorrect
 */
const generateDistractors = (correctAnswer, allConcepts, count = 3) => {
  const distractors = allConcepts
    .filter((c) => c !== correctAnswer.toLowerCase())
    .slice(0, count * 3);

  // Shuffle and pick
  return distractors
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1));
};

/**
 * Capitalize first letter utility
 */
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Generate MCQ quiz questions from text.
 * @param {string} text - Input text
 * @param {number} questionCount - Number of questions to generate (default: 5)
 * @returns {Array} Array of question objects
 */
const generateQuiz = (text, questionCount = 5) => {
  const sentences = getSentences(text);
  const concepts = extractKeyConcepts(text);
  const questions = [];

  // Strategy 1: Fill-in-the-blank style from key sentences
  for (let i = 0; i < concepts.length && questions.length < questionCount; i++) {
    const concept = concepts[i];
    const matchedSentences = findSentencesWithWord(sentences, concept);

    if (!matchedSentences.length) continue;

    // Use the sentence with the concept as context
    const contextSentence = matchedSentences[0];
    const conceptCap = cap(concept);

    // Create a fill-in-the-blank question
    const questionText = `According to the text, which of the following best describes "${conceptCap}"?`;

    const distractors = generateDistractors(concept, concepts.filter((_, idx) => idx !== i));
    if (distractors.length < 3) continue;

    // Build and shuffle options
    const correctOption = `${conceptCap} is a key concept related to: ${contextSentence.slice(0, 80)}...`;
    const wrongOptions = distractors.map(
      (d, idx) => `${d} refers to an unrelated concept in a different domain (Option ${idx + 2})`
    );

    const allOptions = [correctOption, ...wrongOptions];
    // Shuffle options
    const shuffled = allOptions
      .map((opt, idx) => ({ opt, original: idx === 0 }))
      .sort(() => Math.random() - 0.5);

    const correctIndex = shuffled.findIndex((s) => s.original);

    questions.push({
      question: questionText,
      options: shuffled.map((s) => s.opt),
      correctAnswer: correctIndex,
      explanation: `This concept appears in the text as: "${contextSentence.slice(0, 120)}..."`,
    });
  }

  // Strategy 2: True/False-style factual questions from sentences
  const factSentences = sentences
    .filter((s) => s.split(/\s+/).length >= 8 && s.split(/\s+/).length <= 25)
    .slice(0, 20);

  for (let i = 0; i < factSentences.length && questions.length < questionCount; i++) {
    const s = factSentences[i];
    const words = tokenize(s);
    const keyWord = words.find((w) => !STOP_WORDS.has(w) && w.length > 4);
    if (!keyWord) continue;

    const distractors = generateDistractors(keyWord, concepts);
    if (distractors.length < 3) continue;

    const question = `Which statement is correct based on the study material?`;
    const correctOpt = cap(s.trim()) + (s.trim().endsWith('.') ? '' : '.');

    // Generate wrong statements by swapping key word
    const wrongOpts = distractors.map(
      (d) => s.replace(new RegExp(keyWord, 'gi'), d).trim() + '.'
    );

    const allOptions = [correctOpt, ...wrongOpts.slice(0, 3)];
    const shuffled = allOptions
      .map((opt, idx) => ({ opt, original: idx === 0 }))
      .sort(() => Math.random() - 0.5);

    const correctIndex = shuffled.findIndex((x) => x.original);

    questions.push({
      question,
      options: shuffled.map((s) => s.opt),
      correctAnswer: correctIndex,
      explanation: `The correct answer comes directly from the text: "${s.trim()}"`,
    });
  }

  // Pad with generic questions if we still don't have enough
  while (questions.length < Math.min(questionCount, 3)) {
    const topConcepts = concepts.slice(0, 4);
    if (topConcepts.length < 4) break;

    questions.push({
      question: `Which of the following is one of the main topics discussed in this material?`,
      options: topConcepts.map(cap),
      correctAnswer: 0,
      explanation: `"${cap(topConcepts[0])}" is among the most frequently mentioned concepts in the text.`,
    });
  }

  return questions.slice(0, questionCount);
};

module.exports = { summarize, generateQuiz };
