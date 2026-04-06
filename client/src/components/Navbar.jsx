import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard',   icon: '📊' },
  { to: '/upload',       label: 'Upload Notes', icon: '📤' },
  { to: '/quiz',         label: 'Quizzes',      icon: '🧠' },
];

/**
 * Navbar — fixed top navigation with links and user menu.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <NavLink to="/dashboard" className="navbar-brand">
          <div className="brand-icon">🎓</div>
          <span>StudyAI</span>
        </NavLink>

        {/* Navigation Links */}
        {user && (
          <ul className="navbar-nav">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span>{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {/* User Menu */}
        {user && (
          <div className="navbar-user">
            <div className="user-avatar" title={user.name}>{initials}</div>
            <span className="user-name" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </span>
            <button
              id="logout-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Sign out"
            >
              ↩ Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
