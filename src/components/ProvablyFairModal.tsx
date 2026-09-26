import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, Check, Copy, ArrowRight, Eye } from 'lucide-react';
import {
  getServerSeedHash,
  getClientSeed,
  setClientSeed,
  getCurrentNonce,
  rotateServerSeed,
  getRevealedServerSeeds,
  verifyProvablyFairRound,
  ProvablyFairVerificationResult,
  Denomination,
  RevealedSeedPair,
} from '../game/math';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
}) => {
  const [activeTab, setActiveTab] = useState<'PAIR' | 'VERIFY' | 'HISTORY'>('PAIR');

  // Active seeds
  const [serverHash, setServerHash] = useState(getServerSeedHash);
  const [clientSeedInput, setClientSeedInput] = useState(getClientSeed);
  const [clientSeedSaved, setClientSeedSaved] = useState(false);
  const currentNonce = getCurrentNonce();
  const [revealedSeeds, setRevealedSeeds] = useState<RevealedSeedPair[]>(getRevealedServerSeeds);

  // Rotation feedback
  const [justRotated, setJustRotated] = useState<string | null>(null);

  // Verifier tool state
  const [verifyServerSeed, setVerifyServerSeed] = useState(
    'f5e92c730a841d6b2c89f538e1b76420a9d8e57b321c4e908f763a12b456cd9e'
  );
  const [verifyClientSeed, setVerifyClientSeed] = useState(getClientSeed());
  const [verifyNonce, setVerifyNonce] = useState(1);
  const [verifyDenom, setVerifyDenom] = useState<Denomination>(10);
  const [verificationResult, setVerificationResult] = useState<ProvablyFairVerificationResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const handleSaveClientSeed = () => {
    if (!clientSeedInput.trim()) return;
    setClientSeed(clientSeedInput.trim());
    setClientSeedSaved(true);
    setTimeout(() => setClientSeedSaved(false), 2000);
  };

  const handleRotateSeed = () => {
    const { oldSeed, newSeedHash } = rotateServerSeed();
    setServerHash(newSeedHash);
    setRevealedSeeds(getRevealedServerSeeds());
    setJustRotated(oldSeed);
  };

  const handleRunVerify = () => {
    const res = verifyProvablyFairRound(
      verifyServerSeed.trim(),
      verifyClientSeed.trim(),
      verifyNonce,
      verifyDenom
    );
    setVerificationResult(res);
  };

  const formatStop = (s: string) => (!s || s === 'BLANK' || s === '—' || s === '-' ? '-' : s);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0d0f12] border-4 border-[#39FF14] rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(57,255,20,0.3)] text-white font-comic"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#39FF14] border border-[#39FF14]/30 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#39FF14]/20 border-2 border-[#39FF14] text-[#39FF14] mb-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-[#39FF14] tracking-tight">
            PROVABLY FAIR VERIFIER
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Stake Engine Cryptographic HMAC-SHA256 Outcome Auditing
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-5 p-1 bg-black/60 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('PAIR')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PAIR'
                ? 'bg-[#39FF14] text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            ACTIVE SEED PAIR
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('VERIFY');
              if (!verificationResult) handleRunVerify();
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'VERIFY'
                ? 'bg-[#39FF14] text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            VERIFY ROUND
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-[#39FF14] text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            HISTORY ({revealedSeeds.length})
          </button>
        </div>

        {/* TAB 1: ACTIVE SEED PAIR */}
        {activeTab === 'PAIR' && (
          <div className="space-y-4 text-xs">
            {/* Server Seed Hash */}
            <div className="bg-black/60 rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Active Server Seed Hash (SHA-256):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(serverHash, 'hash')}
                  className="flex items-center gap-1 text-[11px] text-[#39FF14] hover:underline cursor-pointer"
                >
                  {copiedText === 'hash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedText === 'hash' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-[11px] text-yellow-300 bg-black/80 p-2.5 rounded-lg border border-yellow-500/20 break-all select-all">
                {serverHash}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                The actual server seed is hidden to prevent outcome tampering. When rotated, it is revealed below.
              </span>
            </div>

            {/* Client Seed */}
            <div className="bg-black/60 rounded-xl p-3.5 border border-white/10">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1.5">
                Your Client Seed (Customizable):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={clientSeedInput}
                  onChange={(e) => setClientSeedInput(e.target.value)}
                  className="flex-1 bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                  placeholder="Enter custom client seed"
                />
                <button
                  type="button"
                  onClick={handleSaveClientSeed}
                  className="px-4 py-2 bg-[#39FF14] hover:bg-lime-400 text-black font-black rounded-lg text-xs cursor-pointer flex items-center gap-1 transition-all"
                >
                  {clientSeedSaved ? <Check className="w-3.5 h-3.5" /> : 'SAVE'}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Change your client seed at any time to alter future outcomes deterministically.
              </span>
            </div>

            {/* Nonce Counter & Rotate Button */}
            <div className="flex items-center justify-between bg-black/60 rounded-xl p-3.5 border border-white/10">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block">
                  Current Nonce:
                </span>
                <span className="text-xl font-black text-white font-micr">{currentNonce}</span>
                <span className="text-[10px] text-slate-400 block">Total rounds played on active seed</span>
              </div>
              <button
                type="button"
                onClick={handleRotateSeed}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold border border-yellow-500/30 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                ROTATE SEED PAIR
              </button>
            </div>

            {/* Just Rotated Notice */}
            {justRotated && (
              <div className="bg-yellow-500/15 border-2 border-yellow-400/40 rounded-xl p-3 animate-fade-in text-yellow-200">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-xs">
                  <Eye className="w-4 h-4 text-yellow-400" />
                  <span>Previous Server Seed Revealed:</span>
                </div>
                <div className="font-mono text-[11px] bg-black/60 p-2 rounded border border-yellow-400/30 break-all select-all text-white">
                  {justRotated}
                </div>
                <span className="text-[10px] text-yellow-300 mt-1 block">
                  You can now copy this revealed server seed and paste it into the <b>Verify Round</b> tab to verify all rounds played with it!
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFY ROUND */}
        {activeTab === 'VERIFY' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Server Seed Input */}
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-bold block mb-1 text-[11px] uppercase">
                  Server Seed (Disclosed):
                </label>
                <input
                  type="text"
                  value={verifyServerSeed}
                  onChange={(e) => setVerifyServerSeed(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-[#39FF14]"
                  placeholder="Paste revealed server seed"
                />
              </div>

              {/* Client Seed Input */}
              <div>
                <label className="text-slate-400 font-bold block mb-1 text-[11px] uppercase">
                  Client Seed:
                </label>
                <input
                  type="text"
                  value={verifyClientSeed}
                  onChange={(e) => setVerifyClientSeed(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              {/* Nonce Input */}
              <div>
                <label className="text-slate-400 font-bold block mb-1 text-[11px] uppercase">
                  Nonce:
                </label>
                <input
                  type="number"
                  min="1"
                  value={verifyNonce}
                  onChange={(e) => setVerifyNonce(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-black/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#39FF14]"
                />
              </div>

              {/* Denomination Input */}
              <div className="sm:col-span-2 flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-white/10">
                <span className="text-[11px] text-slate-300 font-bold">Denomination:</span>
                <div className="flex items-center gap-1.5">
                  {([1, 10, 100, 1000] as Denomination[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setVerifyDenom(d)}
                      className={`px-2.5 py-1 rounded text-xs font-micr font-bold cursor-pointer transition-all ${
                        verifyDenom === d
                          ? 'bg-[#39FF14] text-black font-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {currencySymbol}{d >= 1000 ? '1K' : d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunVerify}
              className="w-full py-2.5 bg-[#39FF14] hover:bg-lime-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all"
            >
              <ShieldCheck className="w-4 h-4 stroke-[3]" />
              VERIFY DETERMINISTIC OUTCOME
            </button>

            {/* Verification Result Breakdown */}
            {verificationResult && (
              <div className="bg-[#142218] border-2 border-[#39FF14] rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#39FF14]/30 pb-2">
                  <div className="flex items-center gap-1.5 text-[#39FF14] font-bold text-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>CRYPTOGRAPHICALLY VERIFIED</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#39FF14]/20 text-[#39FF14] font-bold">
                    HMAC-SHA256 Match
                  </span>
                </div>

                {/* Landed Stops */}
                <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">
                      Reel Stops:
                    </span>
                    <span className="text-base font-black text-yellow-300 font-micr tracking-wider">
                      [ {verificationResult.stops.map(formatStop).join(' ')} ]
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">
                      Outcome Payout:
                    </span>
                    <span className="text-lg font-black text-[#39FF14] font-micr">
                      {currencySymbol}{verificationResult.creditsWon.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Special Event Flags */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {verificationResult.redSpinTriggered && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-md font-bold">
                      🚨 Red-Spin Savior
                    </span>
                  )}
                  {verificationResult.isRespin && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md font-bold">
                      ★ Star Respin ({verificationResult.respinMultiplier}X)
                    </span>
                  )}
                  {verificationResult.isWheel && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md font-bold">
                      🎡 Bonus Wheel ({currencySymbol}{verificationResult.wheelWedgeCredits?.toLocaleString()})
                    </span>
                  )}
                  {verificationResult.multiplier > 1 && !verificationResult.isRespin && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-md font-bold">
                      {verificationResult.multiplier}X Multiplier
                    </span>
                  )}
                </div>

                {/* Derived Floats breakdown */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    First 4 Derived Floats [0, 1):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
                    {verificationResult.floats.slice(0, 4).map((f, i) => (
                      <div key={i} className="bg-black/50 p-1.5 rounded border border-white/10">
                        <span className="text-slate-400 block text-[9px]">Reel {i + 1}:</span>
                        <span className="text-yellow-300 font-bold">{f.toFixed(6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SEED HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-3 text-xs">
            {revealedSeeds.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-black/40 rounded-xl border border-white/10 p-6">
                No seeds rotated yet. Once you rotate your active seed pair, all previously used server seeds will appear here along with their final round nonces.
              </div>
            ) : (
              revealedSeeds.map((seed, idx) => (
                <div key={idx} className="bg-black/60 rounded-xl p-3.5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-400 text-xs">
                      Revealed Server Seed #{revealedSeeds.length - idx}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rounds Played: <b className="text-white font-micr">{seed.finalNonce}</b>
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-200 bg-black/80 p-2 rounded border border-white/10 break-all select-all">
                    {seed.serverSeed}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Rotated {new Date(seed.revealedAt).toLocaleTimeString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyServerSeed(seed.serverSeed);
                        setActiveTab('VERIFY');
                      }}
                      className="text-[#39FF14] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      Verify with this seed <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
