import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  className?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 font-medium shadow-card transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: Record<'primary' | 'outline', string> = {
    primary: 'bg-yinmn_blue-500 text-white hover:bg-yinmn_blue-600 focus:ring-yinmn_blue-500',
    outline: 'bg-transparent border border-chinese_violet-500 text-chinese_violet-500 hover:bg-chinese_violet-100 focus:ring-chinese_violet-500',
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button className={classes} {...props}>{children}</button>;
}
