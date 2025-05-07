import { SelectHTMLAttributes, ReactNode } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: ReactNode;
}

export function Select({ className = '', children, ...props }: SelectProps) {
  const base = 'w-full border border-china_rose-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yinmn_blue-500 transition-colors appearance-none';
  const classes = [base, className].filter(Boolean).join(' ');
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
}
