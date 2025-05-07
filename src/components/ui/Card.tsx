import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  const base = 'bg-white rounded-lg shadow-card p-4';
  const classes = [base, className].filter(Boolean).join(' ');
  return <div className={classes} {...props}>{children}</div>;
}
