import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none disabled:opacity-55 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-400/20 focus:ring-2 focus:ring-amber-400/40',
    secondary: 'border border-slate-800 bg-slate-900/50 backdrop-blur-md text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700 focus:ring-2 focus:ring-slate-700/50',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40',
    danger: 'bg-rose-950/20 text-rose-400 border border-rose-500/20 hover:bg-rose-900/30 hover:border-rose-500/40 hover:text-rose-300 focus:ring-2 focus:ring-rose-500/30',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
