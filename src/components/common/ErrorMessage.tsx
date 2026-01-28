interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function ErrorMessage({
  message,
  title = "Something went wrong",
  onRetry,
  children,
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {children && <div className="mt-3">{children}</div>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-2 focus:outline-offset-2 focus:outline-red-500"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
