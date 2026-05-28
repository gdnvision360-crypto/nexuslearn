'use client';

import { useState, useRef, useEffect } from 'react';

export default function TwoFactorVerify({
  onVerified,
  onCancel,
}: {
  onVerified: () => void;
  onCancel?: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c <= 0 ? 30 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5 && newDigits.every((d) => d)) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      verifyCode(pasted);
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          isBackupCode: false,
          rememberDevice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Invalid code');
        setDigits(Array(6).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      onVerified();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    if (!backupCode.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: backupCode,
          isBackupCode: true,
          rememberDevice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Invalid backup code');
        return;
      }

      onVerified();
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-400 mt-1">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {!useBackupCode ? (
        <>
          {/* 6-digit code input */}
          <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 text-center text-lg font-mono font-bold text-white
                         bg-slate-700 border border-slate-600 rounded-lg outline-none
                         focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                         transition-colors"
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#334155" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="10" fill="none"
                  stroke="#6366f1" strokeWidth="2"
                  strokeDasharray={`${(countdown / 30) * 62.83} 62.83`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-500">
              Code refreshes in {countdown}s
            </span>
          </div>
        </>
      ) : (
        /* Backup Code Input */
        <div className="mb-4">
          <input
            type="text"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="w-full text-center text-lg font-mono tracking-wider bg-slate-700
                     border border-slate-600 rounded-lg px-4 py-3 text-white
                     placeholder-gray-600 outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            onClick={verifyBackupCode}
            disabled={loading || !backupCode.trim()}
            className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                     hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Backup Code'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center mb-3">{error}</p>
      )}

      {/* Remember Device */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-400">Remember this device for 30 days</span>
      </label>

      {/* Toggle */}
      <button
        onClick={() => {
          setUseBackupCode(!useBackupCode);
          setError('');
        }}
        className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {useBackupCode ? '← Use authenticator code' : 'Use a backup code instead'}
      </button>

      {/* Cancel */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
