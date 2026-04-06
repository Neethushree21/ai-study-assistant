/** Displays an error or success alert message */
const AlertMessage = ({ type = 'error', message }) => {
  if (!message) return null;

  const classMap = { error: 'alert-error', success: 'alert-success', info: 'alert-info' };
  const iconMap  = { error: '⚠️', success: '✅', info: 'ℹ️' };

  return (
    <div className={`alert ${classMap[type] || 'alert-info'}`} role="alert">
      <span>{iconMap[type]}</span>
      <span>{message}</span>
    </div>
  );
};

export default AlertMessage;
