/** Spinner with optional label */
const Loader = ({ message = 'Loading…' }) => (
  <div className="loader-overlay">
    <div className="spinner" />
    <span>{message}</span>
  </div>
);

export default Loader;
