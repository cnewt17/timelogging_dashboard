interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
} as const;

export function LoadingSpinner({
  message,
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-gray-300 border-t-gray-600`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
