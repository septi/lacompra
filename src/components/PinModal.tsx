'use client';

// Componente modal para introducir o solicitar un PIN de acceso
import { useState } from 'react';
import { Input, Button } from '@/components/ui';

interface PinModalProps {
  onPinVerified: () => void;
}

const CORRECT_PIN = '112001';

export default function PinModal({ onPinVerified }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      localStorage.setItem('pin_ok', 'true');
      onPinVerified();
      setError('');
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[var(--surface)] p-6 rounded-2xl shadow-md w-full max-w-sm border border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-4 text-center text-neutral-900">Introduce el PIN</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className="mb-3 text-center text-lg tracking-widest font-medium"
            placeholder="******"
            autoFocus
            aria-label="PIN"
          />
          {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
          <Button
            type="submit"
            className="w-full"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
