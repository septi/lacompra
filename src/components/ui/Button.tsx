import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  className?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all focus:outline-none focus:ring-1';
  const variants: Record<'primary' | 'outline', string> = {
    primary: 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] text-white border border-transparent hover:opacity-95 focus:ring-[var(--accent)] shadow-sm',
    outline: 'bg-transparent text-neutral-800 border border-[var(--border)] hover:bg-[var(--surface-alt)] focus:ring-[var(--border)] shadow-none',
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button className={classes} {...props}>{children}</button>;
}
