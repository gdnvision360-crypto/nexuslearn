'use client';

import { useState } from 'react';

import { Check, ClipboardList, HardDrive } from 'lucide-react';
type SetupStep = 'qr' | 'verify' | 'backup';

export default function TwoFactorSetup({
  onComplete,
  onCancel,
}: {
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<SetupStep>('qr');
  const [secret, setSecret] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate secret');
      const data = await res.json();
      setSecret(data.secret);
      setQrUri(data.otpauthUri);
      setStep('qr');
    } catch {
      setError('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode, secret }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Verification failed');
      }
      const data = await res.json();
      setBackupCodes(data.backupCodes || []);
      setIsEnabled(true);
      setStep('backup');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/two-factor', { method: 'DELETE' });
      if (res.ok) {
        setIsEnabled(false);
        setSecret('');
        setStep('qr');
        onComplete?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `NexusLearn 2FA Backup Codes\n${'='.repeat(30)}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexuslearn-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // If already enabled, show disable option
  if (isEnabled && step !== 'backup') {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">2FA is Enabled</h3>
            <p className="text-xs text-gray-400">Your account is protected</p>
          </div>
        </div>
        <button
          onClick={handleDisable}
          disabled={loading}
          className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(['qr', 'verify', 'backup'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${step === s ? 'bg-indigo-600 text-white' :
                (['qr', 'verify', 'backup'].indexOf(step) > i ? 'bg-green-600 text-white' : 'bg-slate-700 text-gray-400')}`}>
              {['qr', 'verify', 'backup'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < 2 && <div className="w-8 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      {/* Step 1: QR Code */}
      {step === 'qr' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white text-center">
            Scan QR Code
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          {!secret ? (
            <button
              onClick={startSetup}
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Start Setup'}
            </button>
          ) : (
            <>
              {/* QR Code placeholder */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center p-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">QR Code</p>
                    <p className="text-[8px] text-gray-400 break-all">{qrUri}</p>
                  </div>
                </div>
              </div>

              {/* Manual entry */}
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Manual entry key:</p>
                <code className="text-sm text-indigo-400 font-mono break-all select-all">
                  {secret}
                </code>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Next: Verify Code
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white text-center">
            Verify Code
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Enter the 6-digit code from your authenticator app
          </p>

          <div className="flex justify-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerifyCode(val);
              }}
              placeholder="000000"
              className="w-48 text-center text-2xl font-mono tracking-[0.5em] bg-slate-700 border border-slate-600
                       rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('qr')}
              className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white bg-slate-700 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">2FA Enabled Successfully!</span>
          </div>

          <h3 className="text-lg font-semibold text-white text-center">
            Save Backup Codes
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Save these codes somewhere safe. Each can only be used once if you lose access to your authenticator.
          </p>

          <div className="bg-slate-900 rounded-lg p-4 grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <code key={i} className="text-sm text-gray-300 font-mono text-center py-1">
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyBackupCodes}
              className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white bg-slate-700 rounded-lg transition-colors"
            >
              <HardDrive className="w-4 h-4 inline" /> Download
            </button>
          </div>

          <button
            onClick={() => onComplete?.()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Cancel */}
      {step !== 'backup' && onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Cancel setup
        </button>
      )}
    </div>
  );
}
