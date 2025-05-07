import { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Checkbox({ className = '', ...props }: CheckboxProps) {
  // Usar paleta: borde rosa suave y color de check azul
  const base = 'w-5 h-5 rounded border-china_rose-300 text-yinmn_blue-500 focus:ring-yinmn_blue-500 transition-colors';
  const classes = [base, className].filter(Boolean).join(' ');
  return <input type="checkbox" className={classes} {...props} />;
}
