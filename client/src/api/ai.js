import api from './axios';

export const summarizeNote      = (noteId)                  => api.post('/ai/summarize', { noteId });
export const generateQuiz       = (noteId, questionCount=5) => api.post('/ai/generate-quiz', { noteId, questionCount });
export const getUserQuizzes     = ()                        => api.get('/ai/quizzes');
export const getQuiz            = (quizId)                  => api.get(`/ai/quiz/${quizId}`);
export const submitQuiz         = (quizId, answers)         => api.post(`/ai/quiz/${quizId}/submit`, { answers });
