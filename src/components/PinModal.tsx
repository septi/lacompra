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
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Introduce el PIN</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className="mb-4 text-center text-lg tracking-widest font-medium"
            placeholder="******"
            autoFocus
            aria-label="PIN"
          />
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
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
