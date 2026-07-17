import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  error,
  placeholder,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-400 tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-slate-900/40 border ${
          error ? 'border-rose-500/40 focus:border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-amber-400/60 focus:ring-amber-400/20'
        } rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 transition duration-200`}
        {...props}
      />
      {error && (
        <span className="text-xs text-rose-400 font-medium mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
