import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import UploadNotesPage  from './pages/UploadNotesPage';
import QuizPage         from './pages/QuizPage';

/**
 * App — root component with router, auth provider, and route definitions.
 */
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upload"    element={<ProtectedRoute><UploadNotesPage /></ProtectedRoute>} />
        <Route path="/quiz"      element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
