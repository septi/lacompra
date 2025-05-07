import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => {
  const base = 'w-full border border-china_rose-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yinmn_blue-500 transition-colors';
  const classes = [base, className].filter(Boolean).join(' ');
  return <input ref={ref} className={classes} {...props} />;
});

Input.displayName = 'Input';
