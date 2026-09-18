interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = { sm: 'h-3.5 w-3.5', md: 'h-6 w-6' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${SIZE_CLASSES[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
