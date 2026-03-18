import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { masterApi, customerApi } from '../services/api';
import { cacheMasterData, getCachedMasterData, saveOfflineCustomer } from '../services/offlineSync';
import { useToast } from '../components/Toast';
import * as XLSX from 'xlsx';

// ─── Selected Expo helper (localStorage = offline cache; DB = source of truth) ─
const SELECTED_EXPO_KEY = 'selectedExpo';
function getSelectedExpo() {
  try { return JSON.parse(localStorage.getItem(SELECTED_EXPO_KEY)) || null; } catch { return null; }
}
function cacheSelectedExpo(expo) {
  if (expo) localStorage.setItem(SELECTED_EXPO_KEY, JSON.stringify(expo));
  else localStorage.removeItem(SELECTED_EXPO_KEY);
}

const FALLBACK_ENQUIRY = [];
const FALLBACK_INDUSTRY = [];

function makeEmptyForm() {
  const sel = getSelectedExpo();
  return {
    expo_id: sel ? String(sel.id) : '',
    expo_name: sel ? sel.expo_name : '',
    company_name: '',
    customer_name: '',
    designation: '',
    phone_number: '',
    mobile_no_2: '',
    enquiry_type: '',
    email: '',
    email_2: '',
    website: '',
    location: '',
    city: '',
    industry_type: '',
    followup_date: '',
    remarks: '',
    sms_sent: false,
    wa_sent: false,
  };
}

const EMPTY_FORM = makeEmptyForm();

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

// ─── ExpoDropdown — 2 options only: current expo + Others ────────────────────

function ExpoDropdown({ name, value, onChange, sources, onAddSource, hasError, currentExpo }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // If the saved value is a custom source (not the current expo id), show input mode
  useEffect(() => {
    if (value && currentExpo && String(value) !== String(currentExpo.id)) {
      setShowCustomInput(true);
      setCustomInput(value);
    } else if (value && !currentExpo) {
      // No current expo set — any non-empty value must be a custom source
      setShowCustomInput(true);
      setCustomInput(value);
    }
  }, [value, currentExpo]);

  const handleCustomInputChange = (e) => {
    const input = e.target.value;
    setCustomInput(input);
    onChange({ target: { name, value: input } });
    if (input.trim()) {
      const matches = sources.filter((s) => s.source_name.toLowerCase().includes(input.toLowerCase()));
      setFilteredSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (sourceName) => {
    setCustomInput(sourceName);
    onChange({ target: { name, value: sourceName } });
    setShowSuggestions(false);
  };

  const handleAddCustomSource = async () => {
    if (customInput.trim()) {
      await onAddSource(customInput.trim());
      setShowSuggestions(false);
    }
  };

  // ── Custom / Others input mode ────────────────────────────────────────────
  if (showCustomInput) {
    return (
      <div className="relative">
        <input
          type="text"
          placeholder="Enter custom source name..."
          value={customInput}
          onChange={handleCustomInputChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => customInput && setShowSuggestions(true)}
          className={getInputClasses(hasError)}
        />
        {showSuggestions && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.length > 0 ? (
              <>
                {filteredSuggestions.map((source) => (
                  <button key={source.id} type="button"
                    onClick={() => handleSuggestionClick(source.source_name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-800"
                  >
                    {source.source_name}
                  </button>
                ))}
                <button type="button" onClick={handleAddCustomSource}
                  className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100"
                >
                  + Add "{customInput}" as new source
                </button>
              </>
            ) : (
              <button type="button" onClick={handleAddCustomSource}
                className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100"
              >
                + Add "{customInput}" as new source
              </button>
            )}
          </div>
        )}
        <button type="button"
          onClick={() => {
            setShowCustomInput(false);
            setCustomInput('');
            // Revert to current expo if one exists
            if (currentExpo) {
              onChange({ target: { name, value: String(currentExpo.id) } });
            } else {
              onChange({ target: { name, value: '' } });
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >✕</button>
      </div>
    );
  }

  // ── Normal dropdown mode: only current expo + Others ─────────────────────
  return (
    <div className="relative">
      <select
        value={currentExpo ? String(currentExpo.id) : ''}
        onChange={(e) => {
          if (e.target.value === 'others') {
            setShowCustomInput(true);
            setCustomInput('');
            onChange({ target: { name, value: '' } });
          } else if (e.target.value && currentExpo) {
            onChange({ target: { name, value: String(currentExpo.id) } });
          }
        }}
        className={getSelectClasses(hasError)}
      >
        {currentExpo ? (
          <option value={String(currentExpo.id)}>{currentExpo.expo_name}</option>
        ) : (
          <option value="">No expo selected — choose Others</option>
        )}
        <option value="others">—— Others (Custom Source) ——</option>
      </select>
      <SelectChevron />
    </div>
  );
}

// ─── Autocomplete Input ────────────────────────────────────────────────────────

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
        setOpen(false);
        setHighlighted(-1);
      }
    };
    const scroll = () => {
      if (showDropdown) updateDropdownPos();
    };
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
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        setOpen(true);
        setHighlighted(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        setHighlighted((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlighted((prev) => (prev > 0 ? prev - 1 : -1));
        e.preventDefault();
        break;
      case 'Enter':
        if (highlighted >= 0) {
          selectOption(filtered[highlighted]);
          e.preventDefault();
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlighted(-1);
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e);
          setOpen(true);
          setHighlighted(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={getInputClasses(hasError)}
      />
      {showDropdown && (
        <div
          ref={listRef}
          style={dropdownStyle}
          className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto"
        >
          {filtered.map((option, idx) => (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              onMouseEnter={() => setHighlighted(idx)}
              className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                idx === highlighted ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100'
              } border-b border-gray-100 last:border-b-0`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Messaging Checkbox ────────────────────────────────────────────────────────

function MessagingCheckbox({ id, checked, onChange, label, sublabel, icon }) {
  return (
    <label className="cursor-pointer">
      <div className="p-4 rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-blue-300 hover:bg-blue-50/30" style={checked ? { borderColor: '#3B82F6', backgroundColor: '#F0F9FF' } : {}}>
        <div className="flex items-start gap-3">
          <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange({ target: { name: id, checked: e.target.checked } })} className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
            </div>
            <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
          </div>
        </div>
      </div>
    </label>
  );
}

// ─── Excel Upload Modal ────────────────────────────────────────────────────────

const EXCEL_COLUMNS = [
  { header: 'Company Name *',           field: 'company_name',   required: true  },
  { header: 'Customer Name *',          field: 'customer_name',  required: true  },
  { header: 'Phone Number 1 *',         field: 'phone_number',   required: true  },
  { header: 'Phone Number 2',           field: 'mobile_no_2',    required: false },
  { header: 'Designation',             field: 'designation',    required: false },
  { header: 'Email 1',                 field: 'email',          required: false },
  { header: 'Email 2',                 field: 'email_2',        required: false },
  { header: 'Website',                 field: 'website',        required: false },
  { header: 'Enquiry Type',            field: 'enquiry_type',   required: false },
  { header: 'Industry Type',           field: 'industry_type',  required: false },
  { header: 'Location',                field: 'location',       required: false },
  { header: 'City',                    field: 'city',           required: false },
  { header: 'Followup Date (YYYY-MM-DD)', field: 'followup_date', required: false },
  { header: 'Remarks',                 field: 'remarks',        required: false },
];

function downloadTemplate() {
  const headers = EXCEL_COLUMNS.map(c => c.header);
  const sample  = [
    'ABC Pvt Ltd', 'John Doe', '9876543210', '9876543211',
    'Manager', 'john@abc.com', '', 'www.abc.com',
    'Website', 'IT', 'Chennai', 'Chennai', '2026-04-01', 'Follow up next week',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = headers.map(() => ({ wch: 24 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'customer_import_template.xlsx');
}

function ExcelUploadModal({ onClose, currentExpo, onImportDone }) {
  const [preview, setPreview] = useState(null);   // { validRows, errorRows }
  const [parsing, setParsing]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: [] });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const parseFile = async (file) => {
    const buf = await file.arrayBuffer();
    const wb  = XLSX.read(buf, { type: 'array' });
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const validRows = [], errorRows = [];
    raw.forEach((row, i) => {
      const mapped = {}, rowErrors = [];
      EXCEL_COLUMNS.forEach(col => {
        const val = (row[col.header] || '').toString().trim();
        mapped[col.field] = val || null;
        if (col.required && !val) rowErrors.push(`"${col.header}" required`);
      });
      if (currentExpo) { mapped.expo_id = currentExpo.id; mapped.expo_name = currentExpo.expo_name; }
      if (rowErrors.length) errorRows.push({ row: i + 2, errors: rowErrors });
      else validRows.push(mapped);
    });
    return { validRows, errorRows };
  };

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const result = await parseFile(file);
      if (!result.validRows.length && !result.errorRows.length) {
        addToast('No data found in file', 'error'); return;
      }
      setPreview(result);
    } catch (err) {
      addToast('Error reading file — check format', 'error');
      console.error(err);
    } finally { setParsing(false); }
  };

  // Drag & drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview?.validRows?.length) return;
    setImporting(true);
    setProgress({ done: 0, total: preview.validRows.length, failed: [] });
    const failed = [];
    for (let i = 0; i < preview.validRows.length; i++) {
      try { await customerApi.create(preview.validRows[i]); }
      catch (err) { failed.push({ row: i + 2, error: err.response?.data?.message || 'Failed' }); }
      setProgress(p => ({ ...p, done: i + 1, failed }));
    }
    const ok = preview.validRows.length - failed.length;
    if (ok)     addToast(`${ok} customer(s) imported`, 'success');
    if (failed.length) addToast(`${failed.length} row(s) failed`, 'error');
    setImporting(false);
    onImportDone?.();
    if (!failed.length) onClose();
  };

  // Preview table columns (subset for display)
  const PREVIEW_COLS = [
    { field: 'company_name',  label: 'Company'   },
    { field: 'customer_name', label: 'Name'       },
    { field: 'phone_number',  label: 'Phone'      },
    { field: 'enquiry_type',  label: 'Enquiry'    },
    { field: 'industry_type', label: 'Industry'   },
    { field: 'city',          label: 'City'       },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Customers from Excel</h3>
            {currentExpo && (
              <p className="text-xs text-blue-600 mt-0.5">
                Expo <strong>{currentExpo.expo_name}</strong> will be auto-assigned to all imported rows
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Template download banner */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-800">Need the template?</p>
              <p className="text-xs text-blue-600 mt-0.5">Download, fill in your data, then upload below.</p>
            </div>
            <button onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>

          {/* Upload zone — only when no preview */}
          {!preview && (
            <div
              onClick={() => !parsing && fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all select-none ${
                dragOver  ? 'border-blue-500 bg-blue-50 scale-[1.01]' :
                parsing   ? 'border-blue-300 bg-blue-50/50 cursor-wait' :
                'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-blue-600 font-medium">Reading file...</p>
                </div>
              ) : (
                <>
                  <svg className={`w-12 h-12 mx-auto mb-3 transition-colors ${dragOver ? 'text-blue-500' : 'text-gray-400'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-800">
                    {dragOver ? 'Drop your file here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">.xlsx or .xls — use the template above for correct column order</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
            </div>
          )}

          {/* Preview */}
          {preview && !importing && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-700">{preview.validRows.length}</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Rows ready to import</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-3xl font-bold text-red-600">{preview.errorRows.length}</p>
                  <p className="text-xs text-red-500 mt-1 font-medium">Rows with errors (skipped)</p>
                </div>
              </div>

              {/* Error details */}
              {preview.errorRows.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
                    <p className="text-xs font-semibold text-red-700">Rows skipped due to errors</p>
                  </div>
                  <div className="divide-y divide-red-50 max-h-28 overflow-y-auto">
                    {preview.errorRows.map((e, i) => (
                      <p key={i} className="px-4 py-2 text-xs text-red-600">
                        <strong>Row {e.row}:</strong> {e.errors.join(' · ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Table preview */}
              {preview.validRows.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      Preview — {preview.validRows.length} row{preview.validRows.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400">Showing all {Math.min(preview.validRows.length, 100)} rows</p>
                  </div>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                          {PREVIEW_COLS.map(c => (
                            <th key={c.field} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.validRows.slice(0, 100).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            {PREVIEW_COLS.map(c => (
                              <td key={c.field} className="px-3 py-2 text-gray-800 max-w-[160px] truncate" title={row[c.field] || ''}>
                                {row[c.field] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
                ← Choose a different file
              </button>
            </div>
          )}

          {/* Import progress */}
          {importing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-600">Importing customers...</span>
                <span className="text-gray-800">{progress.done} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              {progress.failed.length > 0 && (
                <p className="text-xs text-red-500">{progress.failed.length} row(s) failed so far</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={importing}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50">
            {importing ? 'Please wait...' : 'Cancel'}
          </button>
          {preview && !importing && preview.validRows.length > 0 && (
            <button onClick={handleImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V4" />
              </svg>
              Import {preview.validRows.length} Customer{preview.validRows.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CustomerRegistration() {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const { addToast } = useToast();
  const [form, setForm] = useState(makeEmptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [expos, setExpos] = useState([]);
  const [sources, setSources] = useState([]);
  const [enquiryTypes, setEnquiryTypes] = useState(FALLBACK_ENQUIRY);
  const [industryTypes, setIndustryTypes] = useState(FALLBACK_INDUSTRY);
  const [baseEnquiryTypes, setBaseEnquiryTypes] = useState(FALLBACK_ENQUIRY); // general (expo_id=null) entries
  const [baseIndustryTypes, setBaseIndustryTypes] = useState(FALLBACK_INDUSTRY); // general (expo_id=null) entries
  const [showUpload, setShowUpload] = useState(false);
  const [currentExpo, setCurrentExpo] = useState(() => getSelectedExpo());

  // Load master data + current expo from API
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const cached = getCachedMasterData();
        if (cached) {
          setEnquiryTypes(cached.enquiry_types || FALLBACK_ENQUIRY);
          setBaseEnquiryTypes(cached.enquiry_types || FALLBACK_ENQUIRY);
          setIndustryTypes(cached.industry_types || FALLBACK_INDUSTRY);
          setBaseIndustryTypes(cached.industry_types || FALLBACK_INDUSTRY);
        }
        if (!isOnline) return;
        const [expoRes, sourcesRes, enquiryRes, industryRes, currentExpoRes] = await Promise.all([
          masterApi.getExpos(),
          masterApi.getSources(),
          masterApi.getEnquiryTypes(),   // returns enquiry_types_custom rows
          masterApi.getIndustryTypes(),  // returns industry_types_custom rows
          masterApi.getCurrentExpo(),
        ]);

        // General entries = expo_id IS NULL
        const allEnquiry = enquiryRes.data.data || [];
        const allIndustry = industryRes.data.data || [];
        const generalEnquiryNames = allEnquiry.filter(x => !x.expo_id).map(x => x.name);
        const generalIndustryNames = allIndustry.filter(x => !x.expo_id).map(x => x.name);

        const data = {
          expos: expoRes.data.data,
          sources: sourcesRes.data.data || [],
          enquiry_types: generalEnquiryNames,
          industry_types: generalIndustryNames,
        };
        setExpos(data.expos);
        setSources(data.sources);
        setEnquiryTypes(generalEnquiryNames);
        setBaseEnquiryTypes(generalEnquiryNames);
        setIndustryTypes(generalIndustryNames);
        setBaseIndustryTypes(generalIndustryNames);
        cacheMasterData(data);

        // Sync current expo from DB — this is the global source of truth
        const dbExpo = currentExpoRes.data.data || null;
        cacheSelectedExpo(dbExpo);
        setCurrentExpo(dbExpo);
        // Pre-fill expo in form if current expo is set and form is still empty
        if (dbExpo) {
          setForm((prev) =>
            prev.expo_id ? prev : { ...prev, expo_id: String(dbExpo.id), expo_name: dbExpo.expo_name }
          );
        }
      } catch (err) {
        console.error('Master data load error:', err);
      }
    };
    loadMasterData();
  }, [isOnline]);

  // ── Context-aware enquiry + industry types ────────────────────────────────────
  // When an expo is selected: fetch scoped lists (general + expo-specific) from
  // the SMS templates context endpoint (which returns enquiryTypes + industryTypes).
  // When no expo: fall back to general-only (expo_id IS NULL) base lists.
  useEffect(() => {
    if (!isOnline) {
      setEnquiryTypes(baseEnquiryTypes);
      setIndustryTypes(baseIndustryTypes);
      return;
    }
    const expoId = form.expo_id && !isNaN(Number(form.expo_id)) ? String(form.expo_id) : null;

    if (!expoId) {
      setEnquiryTypes(baseEnquiryTypes);
      setIndustryTypes(baseIndustryTypes);
      return;
    }

    // Use the SMS context endpoint — it returns scoped enquiryTypes + industryTypes
    masterApi.getSmsTemplatesForContext(expoId)
      .then((res) => {
        const d = res.data.data;
        if (d && d.enquiryTypes) setEnquiryTypes(d.enquiryTypes.map(x => x.name));
        if (d && d.industryTypes) setIndustryTypes(d.industryTypes.map(x => x.name));
      })
      .catch(() => {
        setEnquiryTypes(baseEnquiryTypes);
        setIndustryTypes(baseIndustryTypes);
      });
  }, [form.expo_id, isOnline]);

  // Add new source (NEW)
  const handleAddSource = async (sourceName) => {
    try {
      const res = await masterApi.addSource({ source_name: sourceName });
      setSources([...sources, res.data.data]);
      return res.data.data;
    } catch (err) {
      console.error('Failed to add source:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.customer_name?.trim()) newErrors.customer_name = 'Required';
    if (!form.company_name?.trim()) newErrors.company_name = 'Required';
    if (!form.phone_number?.trim()) newErrors.phone_number = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (form.email_2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_2)) newErrors.email_2 = 'Invalid email'; // NEW
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please fix errors', 'error');
      return;
    }
    setLoading(true);
    try {
      await customerApi.create(form);
      addToast('Customer registered successfully', 'success');
      setForm(makeEmptyForm());
    } catch (err) {
      if (!isOnline) {
        saveOfflineCustomer(form);
        addToast('Saved offline. Will sync when online.', 'success');
        setForm(makeEmptyForm());
      } else {
        addToast(err.response?.data?.message || 'Registration failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm(makeEmptyForm());
    setErrors({});
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 pt-5 pb-2 px-4">
      <div className="max-w-6xl mx-auto space-y-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Registration</h1>
              <p className="text-sm text-gray-500 mt-1">Add a new customer to the system</p>
            </div>
            <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Import from Excel
            </button>
          </div>
          {!isOnline && <p className="text-xs text-amber-600 mt-3 px-3 py-2 bg-amber-50 rounded-lg">📡 You're offline - data will be saved locally</p>}
          {currentExpo ? (
            <p className="text-xs text-blue-700 mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span><strong>Current Expo:</strong> {currentExpo.expo_name} — pre-selected for all users. Change it in <em>Master Data → Expo Names</em>.</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>No current expo set. Use <em>Master Data → Expo Names</em> to set one, or choose <em>Others</em> in the dropdown.</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company & Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /></svg>}
                title="Company & Customer Information" subtitle="Basic details about the customer"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Company Name" required error={errors.company_name}>
                  <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Enter company name" className={getInputClasses(!!errors.company_name)} />
                </FieldWrapper>
                <FieldWrapper label="Customer Name" required error={errors.customer_name}>
                  <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Full name of contact person" className={getInputClasses(!!errors.customer_name)} />
                </FieldWrapper>
                <FieldWrapper label="Designation" error={errors.designation}>
                  <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g., Manager, Developer" className={getInputClasses(!!errors.designation)} />
                </FieldWrapper>
                <FieldWrapper label="Expo Name / Source" error={errors.expo_id}>
                  <ExpoDropdown name="expo_id" value={form.expo_id || form.expo_name || ''} onChange={handleChange} sources={sources} onAddSource={handleAddSource} hasError={!!errors.expo_id} currentExpo={currentExpo} />
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                title="Contact Information" subtitle="Phone, email and web details"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Phone Number 1" required error={errors.phone_number}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+91 99999 99999" className={`${getInputClasses(!!errors.phone_number)} pl-10`} />
                  </div>
                </FieldWrapper>

                {/* Phone 2 (NEW) */}
                <FieldWrapper label="Phone Number 2" error={errors.mobile_no_2}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <input type="tel" name="mobile_no_2" value={form.mobile_no_2} onChange={handleChange} placeholder="+91 99999 99999" className={`${getInputClasses(!!errors.mobile_no_2)} pl-10`} />
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Email 1" error={errors.email}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={`${getInputClasses(!!errors.email)} pl-10`} />
                  </div>
                </FieldWrapper>

                {/* Email 2 (NEW) */}
                <FieldWrapper label="Email 2" error={errors.email_2}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input type="email" name="email_2" value={form.email_2} onChange={handleChange} placeholder="email2@example.com" className={`${getInputClasses(!!errors.email_2)} pl-10`} />
                  </div>
                </FieldWrapper>

                {/* Website (NEW) */}
                <FieldWrapper label="Website" error={errors.website}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </div>
                    <input type="text" name="website" value={form.website} onChange={handleChange} placeholder="www.company.com" className={`${getInputClasses(!!errors.website)} pl-10`} />
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

          {/* Messaging */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                title="Messaging" subtitle="Mark if SMS or WhatsApp message should be sent"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MessagingCheckbox id="sms_sent" checked={form.sms_sent} onChange={handleChange} label="Send SMS" sublabel="Queue an SMS for this customer" icon="✉️" />
                <MessagingCheckbox id="wa_sent" checked={form.wa_sent} onChange={handleChange} label="Send WhatsApp" sublabel="Queue a WhatsApp message" icon="💬" />
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
              <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={4} placeholder="Add any notes, requirements, or observations about the customer…" className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 border-gray-500 focus:outline-none focus:ring-[1.5] focus:ring-black focus:border-black transition-all duration-200 resize-none" />
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
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] ${
                      loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving...
                      </>
                    ) : isOnline ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Register Customer
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Save Offline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Excel Upload Modal */}
        {showUpload && <ExcelUploadModal onClose={() => setShowUpload(false)} currentExpo={currentExpo} onImportDone={() => addToast('Import complete!', 'success')} />}
      </div>
    </div>
  );
}