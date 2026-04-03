import type { ApiError } from '../types/api';

interface ErrorDisplayProps {
  error: ApiError | null;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="error-display" role="alert">
      <p className="error-message">{error.message}</p>
      {error.details && (
        <ul className="error-details">
          {Object.entries(error.details).map(([field, msg]) => (
            <li key={field}>
              <strong>{field}:</strong> {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
