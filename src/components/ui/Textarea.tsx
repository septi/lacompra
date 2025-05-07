import { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  const base = 'w-full border border-china_rose-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yinmn_blue-500 transition-colors';
  const style = { color: 'var(--foreground)' };

  const classes = [base, className].filter(Boolean).join(' ');
  return <textarea className={classes} style={style} {...props} />;
}
