'use client';

import { useState } from 'react';

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
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
            placeholder="******"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
