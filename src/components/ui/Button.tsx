import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  className?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: Record<'primary' | 'outline', string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'bg-transparent border border-neutral-400 text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button className={classes} {...props}>{children}</button>;
}
