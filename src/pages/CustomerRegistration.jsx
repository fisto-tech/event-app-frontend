import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { masterApi, customerApi } from '../services/api';
import { cacheMasterData, getCachedMasterData, saveOfflineCustomer } from '../services/offlineSync';
import { useToast } from '../components/Toast';
import * as XLSX from 'xlsx';

const FALLBACK_ENQUIRY = ['Website', 'Web App', 'Android App', 'Customised Software', 'ERP', 'CRM', 'Other'];
const FALLBACK_INDUSTRY = ['Agriculture', 'Adhesives', 'Packaging', 'Manufacturing', 'Education', 'Retail', 'IT', 'Healthcare', 'Other'];

const EMPTY_FORM = {
  expo_id: '', expo_name: '', company_name: '', customer_name: '',
  designation: '', phone_number: '', enquiry_type: '', email: '',
  location: '', city: '', industry_type: '', followup_date: '', remarks: '',
  sms_sent: false, wa_sent: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldWrapper({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1.5">
          <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

function getInputClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 border-gray-500 ${
    hasError ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-black'
  }`;
}

function getSelectClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 appearance-none cursor-pointer border-gray-500 ${
    hasError ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-black'
  }`;
}

function SelectChevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ─── Autocomplete — uses a portal-like fixed dropdown to avoid overflow:hidden clipping ──

function AutocompleteInput({ name, value, onChange, suggestions, placeholder, hasError }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;
  const showDropdown = open && filtered.length > 0;

  // Compute dropdown position relative to viewport so it escapes overflow:hidden parents
  const updateDropdownPos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = Math.min(filtered.length * 44, 220);
    const openUpward = spaceBelow < dropHeight + 8 && rect.top > dropHeight + 8;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4, bottom: 'auto' }),
    });
  }, [filtered.length]);

  useEffect(() => {
    if (showDropdown) updateDropdownPos();
  }, [showDropdown, updateDropdownPos]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setHighlighted(-1);
      }
    };
    const scroll = () => { if (showDropdown) updateDropdownPos(); };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', scroll);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', scroll);
    };
  }, [showDropdown, updateDropdownPos]);

  useEffect(() => {
    if (!listRef.current || highlighted < 0) return;
    listRef.current.children[highlighted]?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const selectOption = (option) => {
    onChange({ target: { name, value: option } });
    setOpen(false); setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') { setOpen(true); setHighlighted(0); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); break;
      case 'Enter':     e.preventDefault(); if (highlighted >= 0 && filtered[highlighted]) selectOption(filtered[highlighted]); else setOpen(false); break;
      case 'Escape':    setOpen(false); setHighlighted(-1); break;
      case 'Tab':       if (highlighted >= 0 && filtered[highlighted]) selectOption(filtered[highlighted]); setOpen(false); break;
      default: break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => { onChange(e); setOpen(true); setHighlighted(-1); }}
        onFocus={() => { setOpen(true); updateDropdownPos(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={getInputClasses(hasError)}
      />
      {showDropdown && (
        <ul
          ref={listRef}
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto py-1"
          role="listbox"
        >
          {filtered.map((option, idx) => {
            const mi = value.trim() ? option.toLowerCase().indexOf(value.toLowerCase()) : -1;
            return (
              <li
                key={option}
                role="option"
                aria-selected={idx === highlighted}
                onMouseDown={(e) => { e.preventDefault(); selectOption(option); }}
                onMouseEnter={() => setHighlighted(idx)}
                className={`px-4 py-2.5 text-sm cursor-pointer select-none transition-colors ${
                  idx === highlighted ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mi >= 0 ? (
                  <>{option.slice(0, mi)}<span className={`font-semibold ${idx === highlighted ? 'text-white' : 'text-blue-600'}`}>{option.slice(mi, mi + value.length)}</span>{option.slice(mi + value.length)}</>
                ) : option}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Messaging Checkbox ────────────────────────────────────────────────────────

function MessagingCheckbox({ id, checked, onChange, label, sublabel, icon }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 p-4 rounded-xl border-1 cursor-pointer transition-all duration-150 select-none ${
        checked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-400 hover:border-gray-500 hover:bg-gray-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <input id={id} name={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
        }`}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-1">
        <span className={`text-lg ${checked ? 'opacity-100' : 'opacity-50'}`}>{icon}</span>
        <div>
          <p className={`text-sm font-semibold ${checked ? 'text-blue-800' : 'text-gray-700'}`}>{label}</p>
          <p className="text-xs text-gray-400">{sublabel}</p>
        </div>
      </div>
     
    </label>
  );
}

// ─── Excel Upload Modal ────────────────────────────────────────────────────────

const EXCEL_COL_MAP = {
  'expo name':       'expo_name',
  'company name':    'company_name',
  'customer name':   'customer_name',
  'designation':     'designation',
  'phone':           'phone_number',
  'phone number':    'phone_number',
  'mobile':          'phone_number',
  'enquiry type':    'enquiry_type',
  'enquiry':         'enquiry_type',
  'email':           'email',
  'email id':        'email',
  'location':        'location',
  'city':            'city',
  'industry':        'industry_type',
  'industry type':   'industry_type',
  'follow-up date':  'followup_date',
  'followup date':   'followup_date',
  'next follow-up':  'followup_date',
  'remarks':         'remarks',
  'notes':           'remarks',
};

function ExcelUploadModal({ onClose, expos, onImportDone }) {
  const [stage, setStage] = useState('idle'); // idle | preview | uploading | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [inserted, setInserted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const fileRef = useRef();

  const normalizeKey = (k) => String(k).toLowerCase().trim();

  const parseFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!raw.length) { addToast('File is empty', 'error'); return; }

        // Map columns
        const mapped = raw.map((row) => {
          const out = {};
          Object.entries(row).forEach(([k, v]) => {
            const mapped_key = EXCEL_COL_MAP[normalizeKey(k)];
            if (mapped_key) out[mapped_key] = String(v ?? '').trim();
          });
          return out;
        }).filter((r) => r.company_name || r.customer_name || r.phone_number);

        if (!mapped.length) { addToast('No valid rows found. Check column names.', 'error'); return; }

        // Find internal duplicates (same phone_number within the file)
        const seen = new Map();
        const dupes = [];
        const clean = [];
        mapped.forEach((row, i) => {
          const key = row.phone_number;
          if (key && seen.has(key)) {
            dupes.push({ ...row, _row: i + 2, _reason: `Duplicate of row ${seen.get(key)}` });
          } else {
            if (key) seen.set(key, i + 2);
            clean.push({ ...row, _row: i + 2 });
          }
        });

        setRows(clean);
        setDuplicates(dupes);
        setErrors([]);
        setStage('preview');
      } catch (err) {
        addToast('Failed to parse file: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    setStage('uploading');
    setProgress(0);
    const errs = [];
    let ins = 0;
    let skip = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Simulate progress per row
      const pct = Math.round(((i + 1) / rows.length) * 100);
      await new Promise((r) => setTimeout(r, 60)); // fake per-row delay for progress UX
      setProgress(pct);

      try {
        const payload = {
          ...row,
          employee_id: user.id,
          sms_sent: false,
          wa_sent: false,
        };
        // Find expo_id by expo_name if given
        if (payload.expo_name && expos.length) {
          const match = expos.find((ex) => ex.expo_name?.toLowerCase() === payload.expo_name?.toLowerCase());
          if (match) payload.expo_id = match.id;
        }
        await customerApi.create(payload);
        ins++;
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed';
        errs.push({ ...row, _reason: msg });
        skip++;
      }
    }

    setInserted(ins);
    setSkipped(skip);
    setErrors(errs);
    setStage('done');
    if (ins > 0) onImportDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Import from Excel / CSV</h3>
              <p className="text-xs text-gray-400">Upload .xlsx, .xls or .csv files</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* IDLE — drop zone */}
          {stage === 'idle' && (
            <div className="p-6 space-y-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
                }`}
              >
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Drop your file here or click to browse</p>
                <p className="text-xs text-gray-400">Supports .xlsx, .xls, .csv</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFilePick} className="hidden" />
              </div>

              {/* Column reference */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Expected Column Names</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Company Name', 'Customer Name', 'Phone Number', 'Email', 'City', 'Location', 'Enquiry Type', 'Industry Type', 'Expo Name', 'Designation', 'Follow-up Date', 'Remarks'].map((c) => (
                    <span key={c} className="text-[10px] font-mono bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {stage === 'preview' && (
            <div className="p-6 space-y-4">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                  <span className="text-xl font-bold text-blue-700">{rows.length}</span>
                  <span className="text-xs text-blue-600 font-medium">Ready to import</span>
                </div>
                {duplicates.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="text-xl font-bold text-amber-700">{duplicates.length}</span>
                    <span className="text-xs text-amber-600 font-medium">Duplicates skipped</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-gray-500 font-medium">{fileName}</span>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">Preview (first 5 rows)</p>
                </div>
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead className="bg-gray-100">
                      <tr>
                        {['Row', 'Company', 'Customer', 'Phone', 'City', 'Enquiry', 'Industry'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r) => (
                        <tr key={r._row} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 font-mono">{r._row}</td>
                          <td className="px-3 py-2 text-gray-800 font-medium max-w-[120px] truncate">{r.company_name || '—'}</td>
                          <td className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{r.customer_name || '—'}</td>
                          <td className="px-3 py-2 text-gray-700 font-mono">{r.phone_number || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{r.city || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{r.enquiry_type || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{r.industry_type || '—'}</td>
                        </tr>
                      ))}
                      {rows.length > 5 && (
                        <tr className="border-t border-gray-100 bg-gray-50">
                          <td colSpan={7} className="px-3 py-2 text-center text-gray-400 text-[11px]">
                            + {rows.length - 5} more rows...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Duplicates list */}
              {duplicates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Duplicate entries removed ({duplicates.length})
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {duplicates.map((d, i) => (
                      <div key={i} className="text-[11px] text-amber-700 flex gap-2">
                        <span className="font-mono text-amber-500">Row {d._row}</span>
                        <span>{d.company_name || d.customer_name} — {d._reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPLOADING */}
          {stage === 'uploading' && (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-800">Importing records…</p>
                  <p className="text-sm text-gray-400 mt-1">{Math.round((progress / 100) * rows.length)} of {rows.length} rows processed</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {[
                    { done: progress >= 20, label: 'Validating rows' },
                    { done: progress >= 50, label: 'Sending to server' },
                    { done: progress >= 80, label: 'Inserting into database' },
                    { done: progress >= 100, label: 'Finalizing' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        step.done ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        {step.done
                          ? <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        }
                      </div>
                      <span className={`text-xs ${step.done ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DONE */}
          {stage === 'done' && (
            <div className="p-6 space-y-5">
              <div className="text-center py-2">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${inserted > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {inserted > 0
                    ? <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  }
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Import Complete</h4>
                <p className="text-sm text-gray-500">Here's a summary of what happened</p>
              </div>

              {/* Result grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-700">{inserted}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Inserted</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">{duplicates.length}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Duplicates</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">{skipped}</p>
                  <p className="text-xs text-red-600 font-medium mt-1">Failed</p>
                </div>
              </div>

              {/* Error details */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">Failed rows</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {errors.map((e, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-2 text-red-700">
                        <span className="font-mono text-red-400 flex-shrink-0">Row {e._row}</span>
                        <span>{e.company_name || e.customer_name} — {e._reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
          {stage === 'idle' && (
            <p className="text-xs text-gray-400">Duplicate phone numbers within the file will be skipped automatically.</p>
          )}
          {stage === 'preview' && (
            <>
              <button onClick={() => { setStage('idle'); setRows([]); setDuplicates([]); setFileName(''); }}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                ← Back
              </button>
              <button onClick={handleImport} disabled={rows.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import {rows.length} Rows
              </button>
            </>
          )}
          {(stage === 'done') && (
            <button onClick={onClose} className="ml-auto px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CustomerRegistration() {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const { addToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [expos, setExpos] = useState([]);
  const [enquiryTypes, setEnquiryTypes] = useState([]);
  const [industryTypes, setIndustryTypes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { loadMasterData(); }, [isOnline]); // eslint-disable-line

  const loadMasterData = async () => {
    if (isOnline) {
      try {
        const [expoRes, enquiryRes, industryRes] = await Promise.all([
          masterApi.getExpos(), masterApi.getEnquiryTypes(), masterApi.getIndustryTypes(),
        ]);
        const expoData = expoRes.data.data;
        const enquiryData = enquiryRes.data.data;
        const industryData = industryRes.data.data;
        setExpos(expoData);
        setEnquiryTypes(enquiryData.map((e) => e.name));
        setIndustryTypes(industryData.map((e) => e.name));
        await cacheMasterData('expos', expoData);
        await cacheMasterData('enquiry_types', enquiryData.map((e) => e.name));
        await cacheMasterData('industry_types', industryData.map((e) => e.name));
      } catch { await loadFromCache(); }
    } else { await loadFromCache(); }
  };

  const loadFromCache = async () => {
    setExpos(await getCachedMasterData('expos') || []);
    setEnquiryTypes(await getCachedMasterData('enquiry_types') || FALLBACK_ENQUIRY);
    setIndustryTypes(await getCachedMasterData('industry_types') || FALLBACK_INDUSTRY);
  };

  const validate = () => {
    const errs = {};
    if (!form.company_name.trim()) errs.company_name = 'Company name is required';
    if (!form.customer_name.trim()) errs.customer_name = 'Customer name is required';
    if (!form.phone_number.trim()) errs.phone_number = 'Phone number is required';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone_number)) errs.phone_number = 'Invalid phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'expo_id') {
        const expo = expos.find((ex) => String(ex.id) === String(value));
        updated.expo_name = expo?.expo_name || '';
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }, [expos, errors]);

  const handleClear = () => { setForm(EMPTY_FORM); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { addToast('Please fix validation errors', 'warning'); return; }
    setLoading(true);
    const payload = { ...form, employee_id: user.id };
    try {
      if (isOnline) {
        await customerApi.create(payload);
        addToast('Customer registered successfully!', 'success');
      } else {
        await saveOfflineCustomer(payload);
        addToast('Saved offline. Will sync when connected.', 'warning');
      }
      setForm(EMPTY_FORM); setErrors({});
      setSubmitted(true); setTimeout(() => setSubmitted(false), 3000);
    } catch {
      try { await saveOfflineCustomer(payload); addToast('API error. Saved offline.', 'warning'); setForm(EMPTY_FORM); }
      catch { addToast('Failed to save. Please try again.', 'error'); }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register Customer</h1>
              <p className="text-gray-500 text-sm">Add a new customer lead from your expo</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Import button */}
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Excel / CSV
            </button>
            {/* Online badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              isOnline ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-ping'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {submitted && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Customer registered successfully!</p>
              <p className="text-xs text-emerald-600">The form has been reset for the next entry.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6 max-h-[78vh] overflow-y-auto pb-2">

          {/* Expo */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                title="Expo Information" subtitle="Select the expo where this lead was collected"
              />
              <div className="max-w-md">
                <FieldWrapper label="Expo Name" error={errors.expo_id}>
                  <div className="relative">
                    <select name="expo_id" value={form.expo_id} onChange={handleChange} className={getSelectClasses(!!errors.expo_id)}>
                      <option value="">Select an expo...</option>
                      {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                title="Customer Details" subtitle="Basic information about the customer"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Company Name" required error={errors.company_name}>
                  <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Enter company name" className={getInputClasses(!!errors.company_name)} />
                </FieldWrapper>
                <FieldWrapper label="Customer Name" required error={errors.customer_name}>
                  <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Enter customer name" className={getInputClasses(!!errors.customer_name)} />
                </FieldWrapper>
                <FieldWrapper label="Designation" error={errors.designation}>
                  <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Manager, Director" className={getInputClasses(!!errors.designation)} />
                </FieldWrapper>
                <FieldWrapper label="Phone Number" required error={errors.phone_number}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+91 99999 99999" className={`${getInputClasses(!!errors.phone_number)} pl-10`} />
                  </div>
                </FieldWrapper>
                <FieldWrapper label="Email Address" error={errors.email}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={`${getInputClasses(!!errors.email)} pl-10`} />
                  </div>
                </FieldWrapper>
                <FieldWrapper label="Enquiry Type" error={errors.enquiry_type}>
                  <AutocompleteInput name="enquiry_type" value={form.enquiry_type} onChange={handleChange} suggestions={enquiryTypes} placeholder="Type or pick enquiry type…" hasError={!!errors.enquiry_type} />
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Location & Industry */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                title="Location & Industry" subtitle="Where the customer is based and their industry"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Location / Address" error={errors.location}>
                  <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Enter address or area" className={getInputClasses(!!errors.location)} />
                </FieldWrapper>
                <FieldWrapper label="City" error={errors.city}>
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Enter city name" className={getInputClasses(!!errors.city)} />
                </FieldWrapper>
                <FieldWrapper label="Industry Type" error={errors.industry_type}>
                  <AutocompleteInput name="industry_type" value={form.industry_type} onChange={handleChange} suggestions={industryTypes} placeholder="Type or pick industry…" hasError={!!errors.industry_type} />
                </FieldWrapper>
                <FieldWrapper label="Next Follow-up Date" error={errors.followup_date}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <input type="date" name="followup_date" value={form.followup_date} onChange={handleChange} className={`${getInputClasses(!!errors.followup_date)} pl-10`} />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Messaging — 2 checkboxes only */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                title="Messaging" subtitle="Mark if SMS or WhatsApp message should be sent to this customer"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MessagingCheckbox
                  id="sms_sent"
                  checked={form.sms_sent}
                  onChange={handleChange}
                  label="Send SMS"
                  sublabel="Queue an SMS for this customer"
                  icon="✉️"
                />
                <MessagingCheckbox
                  id="wa_sent"
                  checked={form.wa_sent}
                  onChange={handleChange}
                  label="Send WhatsApp"
                  sublabel="Queue a WhatsApp message"
                  icon="💬"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                title="Additional Notes" subtitle="Any remarks or special requirements"
              />
              <textarea
                name="remarks" value={form.remarks} onChange={handleChange} rows={4}
                placeholder="Add any notes, requirements, or observations about the customer..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 border-gray-500 focus:outline-none focus:ring-[1.5] focus:ring-black focus:border-black transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky bottom-0">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Employee ID: {user?.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleClear}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear Form
                  </button>
                  <button type="submit" disabled={loading}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] ${
                      loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                    }`}>
                    {loading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : isOnline ? (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Register Customer</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Save Offline</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Excel Upload Modal */}
      {showUpload && (
        <ExcelUploadModal
          onClose={() => setShowUpload(false)}
          expos={expos}
          onImportDone={() => addToast('Import complete! Records added to database.', 'success')}
        />
      )}
    </div>
  );
}