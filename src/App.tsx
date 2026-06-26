import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Copy, RefreshCw, Check, ShieldCheck, Info, ShieldAlert } from 'lucide-react';
import { generateSecurePassword, calculateEntropy, getStrengthFeedback, getTimeToCrack } from './utils';

export default function App() {
  const [length, setLength] = useState(16);
  const [keyword, setKeyword] = useState('');
  const [keywordPosition, setKeywordPosition] = useState<'random' | 'front' | 'back'>('random');
  const [options, setOptions] = useState({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const effectiveLength = Math.max(length, keyword.length);

  const handleGenerate = useCallback(() => {
    const hasCharOption = options.upper || options.lower || options.numbers || options.symbols;
    if (!hasCharOption && !keyword) {
      setPassword('');
      return;
    }
    const newPwd = generateSecurePassword(effectiveLength, options, keyword, keywordPosition);
    setPassword(newPwd);
    setCopied(false);
  }, [effectiveLength, options, keyword, keywordPosition]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleOptionChange = (key: keyof typeof options) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent unchecking the last character option, unless there's a keyword
      const hasCharOption = next.upper || next.lower || next.numbers || next.symbols;
      if (!hasCharOption && !keyword) return prev;
      return next;
    });
  };

  let poolSize = 0;
  if (options.upper) poolSize += 26;
  if (options.lower) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += 29;

  const entropy = calculateEntropy(password.length, poolSize, keyword.length);
  const strength = getStrengthFeedback(entropy);

  const renderPassword = () => {
    if (!password) return 'Memuat...';
    if (!keyword) return password;
    
    const index = password.indexOf(keyword);
    if (index === -1) return password;

    const before = password.substring(0, index);
    const match = password.substring(index, index + keyword.length);
    const after = password.substring(index + keyword.length);

    return (
      <>
        {before}
        <span className="text-white font-bold bg-emerald-500/20 px-1 py-0.5 mx-0.5 rounded-md border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Kunci Generator</h1>
          <p className="text-sm text-slate-400">Buat kata sandi kuat dan aman secara lokal.</p>
        </div>

        {/* Password Display */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-30 transition duration-300 blur"></div>
          <div className="relative flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="overflow-x-auto whitespace-nowrap flex-1 mr-4" style={{ scrollbarWidth: 'none' }}>
              <span className="font-mono text-xl md:text-2xl text-emerald-400 tracking-wider">
                {renderPassword()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Salin kata sandi"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={handleGenerate}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Buat ulang kata sandi"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Strength Indicator */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Kekuatan Sandi</span>
              <span className={`font-medium ${strength.textColor}`}>{strength.label}</span>
            </div>
            <div className="flex gap-1.5 h-1.5">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex-1 rounded-full ${
                    i < strength.score ? strength.color : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-500">Estimasi Waktu Retas (Offline)</span>
              <span className="text-slate-400 font-medium">{getTimeToCrack(entropy)}</span>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 flex gap-3 items-start border border-slate-700/50">
            <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-300 font-medium block mb-1">Serangan Online vs Offline</span>
              Estimasi retas ini mengasumsikan <strong>serangan offline</strong> (hacker membongkar database dengan kecepatan 100 miliar tebakan/detik). Di dunia nyata (online), sistem akan <strong>memblokir atau menangguhkan akun</strong> setelah beberapa kali percobaan sandi gagal (Rate Limiting).
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-300 block">Kata Khusus (Opsional)</label>
            <div className="space-y-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Contoh: kucing"
                maxLength={32}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              {keyword && (
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['front', 'random', 'back'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setKeywordPosition(pos)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        keywordPosition === pos
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {pos === 'front' ? 'Di Depan' : pos === 'back' ? 'Di Belakang' : 'Acak'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">Panjang Total</label>
              <span className="text-emerald-400 font-mono text-lg bg-emerald-400/10 px-3 py-1 rounded-md">
                {effectiveLength}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(8, keyword.length)}
              max={Math.max(64, keyword.length)}
              value={effectiveLength}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 block mb-2">Pengaturan Karakter</label>
            <Checkbox option="upper" label="Huruf Besar (A-Z)" checked={options.upper} onChange={handleOptionChange} />
            <Checkbox option="lower" label="Huruf Kecil (a-z)" checked={options.lower} onChange={handleOptionChange} />
            <Checkbox option="numbers" label="Angka (0-9)" checked={options.numbers} onChange={handleOptionChange} />
            <Checkbox option="symbols" label="Simbol (!@#$)" checked={options.symbols} onChange={handleOptionChange} />
          </div>
        </div>
        
        <div className="pt-2 border-t border-slate-800">
          <p className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed mb-6">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Keamanan dijamin: Pembuatan kata sandi diproses 100% lokal di browser Anda menggunakan Cryptographically Secure Pseudorandom Number Generator (CSPRNG).
          </p>
        </div>
      </div>
    </div>
  );
}

function Checkbox({
  option,
  label,
  checked,
  onChange,
}: {
  option: string;
  label: string;
  checked: boolean;
  onChange: (key: any) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800/50 cursor-pointer transition-colors group">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => onChange(option)}
      />
      <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-700'} border`}>
        {checked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}
      </div>
    </label>
  );
}
