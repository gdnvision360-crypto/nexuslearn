"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOutgoing,
  Copy,
  Check,
  X,
  Globe,
  Hash,
  Wifi,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface DialInNumber {
  country: string;
  number: string;
  toll: boolean;
}

interface DialInInfo {
  meetingId: string;
  meetingTitle: string;
  numbers: DialInNumber[];
  pin: string;
  sipUri: string;
  dtmfLegend: { key: string; action: string }[];
}

interface PhoneParticipant {
  id: string;
  name: string;
  phoneNumber: string;
  status: "ringing" | "connected" | "disconnected";
  joinedAt?: string;
}

interface PhoneDialInProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

// ============================================================
// PhoneDialIn
// ============================================================

export function PhoneDialIn({ meetingId, isHost, onClose }: PhoneDialInProps) {
  const [dialInInfo, setDialInInfo] = useState<DialInInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDialOut, setShowDialOut] = useState(false);
  const [dialOutNumber, setDialOutNumber] = useState("");
  const [dialOutLoading, setDialOutLoading] = useState(false);
  const [dialOutError, setDialOutError] = useState<string | null>(null);
  const [phoneParticipants] = useState<PhoneParticipant[]>([]);
  const [activeTab, setActiveTab] = useState<"dialin" | "dialout" | "sip">("dialin");

  // Fetch dial-in info
  useEffect(() => {
    async function fetchDialInInfo() {
      try {
        setLoading(true);
        const response = await fetch(`/api/meetings/${meetingId}/dial-in`);
        if (!response.ok) throw new Error("Failed to fetch dial-in info");
        const data = (await response.json()) as DialInInfo;
        setDialInInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDialInInfo();
  }, [meetingId]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  // Dial out
  const handleDialOut = useCallback(async () => {
    if (!dialOutNumber.trim()) return;
    setDialOutLoading(true);
    setDialOutError(null);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/dial-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: dialOutNumber }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to dial out");
      }
      setDialOutNumber("");
      setShowDialOut(false);
    } catch (err) {
      setDialOutError(err instanceof Error ? err.message : "Dial-out failed");
    } finally {
      setDialOutLoading(false);
    }
  }, [meetingId, dialOutNumber]);

  const CopyButton = ({
    text,
    field,
  }: {
    text: string;
    field: string;
  }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-green-400" />
          <h2 className="text-sm font-semibold text-white">Phone Dial-In</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(["dialin", "dialout", "sip"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab === "dialin" ? "Dial In" : tab === "dialout" ? "Dial Out" : "SIP"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-600/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : dialInInfo ? (
          <>
            {/* Dial In Tab */}
            {activeTab === "dialin" && (
              <div className="space-y-4">
                {/* PIN */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                    <Hash className="h-3.5 w-3.5" />
                    Meeting PIN
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold tracking-wider text-white">
                      {dialInInfo.pin}
                    </span>
                    <CopyButton text={dialInInfo.pin} field="pin" />
                  </div>
                </div>

                {/* Phone Numbers */}
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Globe className="h-3.5 w-3.5" />
                    Dial-in Numbers
                  </h3>
                  <div className="space-y-1.5">
                    {dialInInfo.numbers.map((num, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">
                            {num.country}
                          </span>
                          <span className="font-mono text-sm text-white">
                            {num.number}
                          </span>
                          {num.toll && (
                            <span className="rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                              Toll
                            </span>
                          )}
                        </div>
                        <CopyButton text={num.number} field={`num-${idx}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copy All Info */}
                <button
                  onClick={() => {
                    const text = `Join by phone:\n${dialInInfo.numbers.map((n) => `${n.country}: ${n.number}`).join("\n")}\nPIN: ${dialInInfo.pin}\nSIP: ${dialInInfo.sipUri}`;
                    copyToClipboard(text, "all");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                >
                  {copiedField === "all" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy all dial-in info
                </button>

                {/* DTMF Legend */}
                <div>
                  <h3 className="mb-2 text-xs font-medium text-gray-400">
                    Phone Controls (DTMF)
                  </h3>
                  <div className="space-y-1">
                    {dialInInfo.dtmfLegend.map((cmd) => (
                      <div
                        key={cmd.key}
                        className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm"
                      >
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {cmd.key}
                        </span>
                        <span className="text-xs text-gray-400">
                          {cmd.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dial Out Tab */}
            {activeTab === "dialout" && (
              <div className="space-y-4">
                {isHost ? (
                  <>
                    <p className="text-xs text-gray-400">
                      Invite someone by calling their phone number directly.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={dialOutNumber}
                          onChange={(e) => setDialOutNumber(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleDialOut}
                          disabled={!dialOutNumber.trim() || dialOutLoading}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                        >
                          {dialOutLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4" />
                          )}
                          Call
                        </button>
                      </div>
                      {dialOutError && (
                        <p className="text-xs text-red-400">{dialOutError}</p>
                      )}
                    </div>

                    {/* Active Phone Participants */}
                    {phoneParticipants.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-medium text-gray-400">
                          Phone Participants
                        </h3>
                        <div className="space-y-1.5">
                          {phoneParticipants.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <PhoneCall
                                  className={`h-4 w-4 ${
                                    p.status === "connected"
                                      ? "text-green-400"
                                      : p.status === "ringing"
                                        ? "text-yellow-400"
                                        : "text-gray-500"
                                  }`}
                                />
                                <div>
                                  <p className="text-sm text-white">{p.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {p.phoneNumber}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-xs ${
                                  p.status === "connected"
                                    ? "text-green-400"
                                    : p.status === "ringing"
                                      ? "text-yellow-400"
                                      : "text-gray-500"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-gray-800 p-4 text-center text-sm text-gray-400">
                    Only the host can invite participants by phone.
                  </div>
                )}
              </div>
            )}

            {/* SIP Tab */}
            {activeTab === "sip" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Connect from a conference room system using SIP.
                </p>

                <div className="rounded-xl bg-gray-800 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                    <Wifi className="h-3.5 w-3.5" />
                    SIP URI
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="break-all font-mono text-sm text-white">
                      {dialInInfo.sipUri}
                    </span>
                    <CopyButton text={dialInInfo.sipUri} field="sip" />
                  </div>
                </div>

                <div className="rounded-lg bg-gray-800/50 p-3 text-xs text-gray-400">
                  <p className="mb-2 font-medium text-gray-300">
                    SIP Connection Instructions:
                  </p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>Open your SIP client or room system</li>
                    <li>Dial the SIP URI shown above</li>
                    <li>Enter the meeting PIN when prompted: <strong className="text-white">{dialInInfo.pin}</strong></li>
                    <li>You&apos;ll be connected to the meeting audio</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
