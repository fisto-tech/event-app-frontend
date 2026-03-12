import React, { useState, useEffect, useCallback, useRef } from 'react';
import { followupApi } from '../services/api';
import { useToast } from '../components/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = [
  { key: '', label: 'All Stages' },
  { key: 'first_followup', label: 'First Follow-up', tw: 'bg-indigo-100 text-indigo-700 border-indigo-300', color: '#6366f1' },
  { key: 'proposal', label: 'Proposal', tw: 'bg-amber-100 text-amber-700 border-amber-300', color: '#f59e0b' },
  { key: 'lead', label: 'Lead', tw: 'bg-emerald-100 text-emerald-700 border-emerald-300', color: '#10b981' },
  { key: 'confirm', label: 'Confirm', tw: 'bg-blue-100 text-blue-700 border-blue-300', color: '#3b82f6' },
];

const formatDate = (d) => {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.split('T')[0] : d;
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr.split('T')[0] + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - d) / 86400000);
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ children, className = '', size = 16 }) => (
  <svg className={`shrink-0 ${className}`} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IconAlertTriangle = ({ className }) => (
  <Icon className={className} size={20}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);
const IconSearch = ({ className }) => (
  <Icon className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
);
const IconHistory = ({ className }) => (
  <Icon className={className} size={14}>
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
  </Icon>
);
const IconClose = ({ className }) => (
  <Icon className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
);
const IconUser = ({ className }) => (
  <Icon className={className} size={14}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </Icon>
);
const IconFilter = ({ className }) => (
  <Icon className={className} size={14}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icon>
);
const IconRefresh = ({ className }) => (
  <Icon className={className} size={14}>
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Icon>
);
const IconPhone = ({ className }) => (
  <Icon className={className} size={14}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.3a16 16 0 0 0 5.8 5.8l.91-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);
const IconBuilding = ({ className }) => (
  <Icon className={className} size={14}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
  </Icon>
);
const IconCalendar = ({ className }) => (
  <Icon className={className} size={14}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);
const IconClock = ({ className }) => (
  <Icon className={className} size={14}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </Icon>
);
const IconChevronDown = ({ className }) => (
  <Icon className={className} size={14}><polyline points="6 9 12 15 18 9" /></Icon>
);
const IconCheck = ({ className }) => (
  <Icon className={className} size={14}><polyline points="20 6 9 17 4 12" /></Icon>
);

// ─── Bracket Config ───────────────────────────────────────────────────────────
const BRACKETS = [
  {
    label: 'Critical — 7+ days overdue',
    min: 7,
    headerBg: 'bg-red-600',
    headerText: 'text-white',
    rowStripe: 'bg-red-50/40',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-300',
    dateBg: 'bg-red-50',
    dateText: 'text-red-600',
    dotBg: 'bg-red-500',
    borderColor: 'border-red-300',
    accentColor: 'border-l-red-500',
  },
  {
    label: '3–6 days overdue',
    min: 3, max: 6,
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
    rowStripe: 'bg-amber-50/40',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300',
    dateBg: 'bg-amber-50',
    dateText: 'text-amber-600',
    dotBg: 'bg-amber-500',
    borderColor: 'border-amber-300',
    accentColor: 'border-l-amber-500',
  },
  {
    label: '1–2 days overdue',
    min: 1, max: 2,
    headerBg: 'bg-indigo-500',
    headerText: 'text-white',
    rowStripe: 'bg-indigo-50/40',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-300',
    dateBg: 'bg-indigo-50',
    dateText: 'text-indigo-600',
    dotBg: 'bg-indigo-500',
    borderColor: 'border-indigo-300',
    accentColor: 'border-l-indigo-500',
  },
];

// ─── Search Field Dropdown ────────────────────────────────────────────────────
const SEARCH_FIELDS = [
  { key: 'all', label: 'All Fields' },
  { key: 'company_name', label: 'Company' },
  { key: 'customer_name', label: 'Contact' },
  { key: 'phone_number', label: 'Phone' },
];

function SearchFieldDropdown({ selectedField, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = SEARCH_FIELDS.find(f => f.key === selectedField);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 
                   border-2 border-gray-300 border-r-0 rounded-l-xl text-sm font-semibold 
                   text-gray-700 transition-colors whitespace-nowrap focus:outline-none 
                   focus:ring-2 focus:ring-indigo-400 min-w-[120px] sm:min-w-[140px]"
      >
        <IconFilter className="text-gray-500 w-3.5 h-3.5" />
        <span className="hidden sm:inline">{selected?.label}</span>
        <span className="sm:hidden">{selected?.key === 'all' ? 'All' : selected?.label}</span>
        <IconChevronDown className={`text-gray-400 w-3 h-3 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border-2 border-gray-200 
                        rounded-xl shadow-xl z-50 py-1.5">
          {SEARCH_FIELDS.map(field => (
            <button
              key={field.key}
              onClick={() => { onSelect(field.key); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm 
                          transition-colors text-left hover:bg-gray-50
                          ${selectedField === field.key ? 'text-indigo-700 font-semibold bg-indigo-50' : 'text-gray-700'}`}
            >
              <span>{field.label}</span>
              {selectedField === field.key && <IconCheck className="text-indigo-600 w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({ customerId, companyName, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    followupApi.getHistory(customerId).then((res) => {
      if (res.success) setHistory(res.data);
      setLoading(false);
    });
  }, [customerId]);

  const stageInfo = (s) => STAGES.find(st => st.key === s);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col 
                    shadow-2xl border-2 border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
          <div>
            <p className="text-[11px] font-bold  text-red-500 uppercase tracking-wider mb-1">
              Follow-up History
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{companyName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 
                       transition-colors border-2 border-gray-200"
          >
            <IconClose />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-8 h-8 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto" />
              <p className="mt-4  text-sm text-gray-400">Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-16 text-center text-gray-400  text-sm">
              No follow-up history for this customer.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <table className="w-full border-collapse hidden md:table">
                <thead>
                  <tr className="bg-gray-100">
                    {['Date & Time', 'Stage', 'Contact', 'Phone', 'Remarks', 'Next Follow-up', 'By'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 
                                              uppercase tracking-wider border-b-2 border-gray-200 
                                             whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => {
                    const si = stageInfo(row.followup_stage);
                    return (
                      <tr key={row.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-indigo-50/30 transition-colors`}>
                        <td className="px-4 py-3 border-b-2 border-gray-100 whitespace-nowrap">
                          <p className="text-xs  text-gray-700">
                            {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[11px]  text-gray-400">
                            {new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-gray-100">
                          <span className={`text-[11px] font-semibold  px-2.5 py-1 rounded-full 
                                           ${si?.tw || 'bg-gray-100 text-gray-600 border-gray-200'} border`}>
                            {si?.label || row.followup_stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-gray-100 text-sm text-gray-700">{row.contact_name}</td>
                        <td className="px-4 py-3 border-b-2 border-gray-100  text-xs text-gray-600">{row.contact_phone}</td>
                        <td className="px-4 py-3 border-b-2 border-gray-100 max-w-[200px]">
                          <span className="text-xs text-gray-500 line-clamp-2">{row.remarks || '—'}</span>
                        </td>
                        <td className="px-4 py-3 border-b-2 border-gray-100  text-xs text-gray-600 whitespace-nowrap">
                          {row.next_followup_date ? formatDate(row.next_followup_date) : '—'}
                        </td>
                        <td className="px-4 py-3 border-b-2 border-gray-100 text-sm text-gray-700">{row.employee_name || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y-2 divide-gray-100">
                {history.map((row) => {
                  const si = stageInfo(row.followup_stage);
                  return (
                    <div key={row.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className=" text-xs text-gray-500">
                          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[10px] font-semibold  px-2 py-0.5 rounded-full 
                                         ${si?.tw || 'bg-gray-100 text-gray-600'} border`}>
                          {si?.label || row.followup_stage}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{row.contact_name}</p>
                      <p className="text-xs  text-gray-500">{row.contact_phone}</p>
                      {row.remarks && <p className="text-xs text-gray-500 line-clamp-2">{row.remarks}</p>}
                      <div className="flex justify-between text-[11px] text-gray-400 ">
                        <span>Next: {row.next_followup_date ? formatDate(row.next_followup_date) : '—'}</span>
                        <span>By: {row.employee_name || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFollowupPage() {
  const { addToast } = useToast();
  const [missedData, setMissedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [historyModal, setHistoryModal] = useState(null);
  const [collapsedBrackets, setCollapsedBrackets] = useState({});
  const debRef = useRef(null);

  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followupApi.getAdminMissed({
        search: debouncedSearch,
        searchField,
        stage: stageFilter,
      });
      if (res.success) setMissedData(res.data);
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, searchField, stageFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stageInfo = (s) => STAGES.find(st => st.key === s);

  const getRows = (bracket) =>
    missedData.filter((r) => {
      const d = daysSince(r.followup_date);
      if (d === null) return false;
      if (bracket.max !== undefined) return d >= bracket.min && d <= bracket.max;
      return d >= bracket.min;
    });

  const toggleBracket = (label) => {
    setCollapsedBrackets(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Stats
  const totalMissed = missedData.length;
  const criticalCount = getRows(BRACKETS[0]).length;
  const warningCount = getRows(BRACKETS[1]).length;
  const recentCount = getRows(BRACKETS[2]).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ">

      {/* ─── Header ─── */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 sm:p-7 mb-6 
                      shadow-lg shadow-red-200/50 border-2 border-red-400">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm 
                            flex items-center justify-center border-2 border-white/30">
              <IconAlertTriangle className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Missed Follow-ups
              </h1>
              <p className="text-red-100 text-sm mt-0.5  tracking-wide">
                Admin overview of all overdue follow-ups
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Stats pills */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm 
                               rounded-full border-2 border-white/30 text-white text-xs font-bold ">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {totalMissed} Total
              </span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-800/50 
                                 rounded-full border border-red-300/30 text-red-100 text-[11px] font-bold ">
                  {criticalCount} critical
                </span>
              )}
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 
                         backdrop-blur-sm border-2 border-white/30 text-white text-sm font-semibold 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 
                         active:scale-95"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Bar */}
        {totalMissed > 0 && (
          <div className="flex gap-3 mt-5 flex-wrap">
            <div className="flex items-center gap-2 bg-red-700/50 rounded-xl px-3 py-2 border border-red-400/30">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <span className="text-[11px]  text-red-100">
                <span className="font-bold text-white">{criticalCount}</span> Critical (7d+)
              </span>
            </div>
            <div className="flex items-center gap-2 bg-red-700/50 rounded-xl px-3 py-2 border border-red-400/30">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <span className="text-[11px]  text-red-100">
                <span className="font-bold text-white">{warningCount}</span> Warning (3-6d)
              </span>
            </div>
            <div className="flex items-center gap-2 bg-red-700/50 rounded-xl px-3 py-2 border border-red-400/30">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-300" />
              <span className="text-[11px]  text-red-100">
                <span className="font-bold text-white">{recentCount}</span> Recent (1-2d)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search with dropdown */}
        <div className="flex flex-1 min-w-0 max-w-xl">
          <SearchFieldDropdown selectedField={searchField} onSelect={setSearchField} />
          <div className="flex items-center gap-2.5 bg-white border-2 border-l-0 border-gray-300 
                          rounded-r-xl px-3.5 py-2.5 shadow-sm flex-1 min-w-0
                          hover:border-gray-400 transition-colors 
                          focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
            <IconSearch className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={searchField === 'all' ? 'Search across all fields…' : `Search by ${SEARCH_FIELDS.find(f => f.key === searchField)?.label?.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none text-sm text-gray-700 bg-transparent flex-1 
                         min-w-0 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-400 
                           hover:text-gray-600 transition-colors shrink-0"
              >
                <IconClose className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-2 bg-white border-2 border-gray-300 rounded-xl 
                        px-3.5 py-2.5 shadow-sm hover:border-gray-400 transition-colors
                        focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <IconFilter className="text-gray-400 shrink-0" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="border-none outline-none text-sm text-gray-700 bg-transparent cursor-pointer 
                       min-w-[120px] font-medium"
          >
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-400  text-sm">Loading missed follow-ups…</p>
        </div>
      ) : totalMissed === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 border-2 border-emerald-200">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-lg font-bold text-emerald-700">No Missed Follow-ups!</p>
          <p className="text-sm text-gray-500 mt-2 ">All follow-ups are on track. Great work!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 ">
          {BRACKETS.map((bracket) => {
            const rows = getRows(bracket);
            if (rows.length === 0) return null;
            const isCollapsed = collapsedBrackets[bracket.label];

            return (
              <div key={bracket.label} className={`border-2 ${bracket.borderColor} rounded-2xl overflow-hidden shadow-sm`}>
                {/* Bracket Header */}
                <button
                  onClick={() => toggleBracket(bracket.label)}
                  className={`w-full flex items-center justify-between px-5 py-4 ${bracket.headerBg} 
                             ${bracket.headerText} cursor-pointer focus:outline-none transition-colors`}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white/40" />
                    <span className="text-sm sm:text-base font-bold tracking-tight">
                      {bracket.label}
                    </span>
                    <span className="text-[11px]  bg-white/20 backdrop-blur-sm px-2.5 py-0.5 
                                     rounded-full border border-white/30 font-bold">
                      {rows.length} {rows.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                  <IconChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 
                                               ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>

                {/* Bracket Content */}
                <div className={`transition-all duration-200 ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[5000px]'}`}>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className={`px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap `}>
                            Company
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Contact Person
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Phone
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Stage
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Due Date
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Days Overdue
                          </th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap">
                            Assigned To
                          </th>
                          <th className="px-4 py-3 text-center text-[12px] font-bold text-gray-800  
                                         uppercase tracking-wider border-2 border-gray-300 whitespace-nowrap w-28">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const si = stageInfo(row.current_stage);
                          const days = daysSince(row.followup_date);
                          return (
                            <tr
                              key={row.id}
                              className={`${i % 2 === 0 ? 'bg-white' : bracket.rowStripe} 
                                         hover:bg-gray-50 transition-colors border-l-4 ${bracket.accentColor}`}
                            >
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <div className="flex items-center gap-2">
                                  <IconBuilding className="text-gray-400 w-3.5 h-3.5 shrink-0" />
                                  <span className="text-sm font-semibold text-gray-900">{row.company_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <div className="flex items-center gap-2">
                                  <IconUser className="text-gray-400 w-3.5 h-3.5 shrink-0" />
                                  <span className="text-sm text-gray-700">{row.customer_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <span className="text-sm  text-gray-600">{row.phone_number}</span>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                {si?.key ? (
                                  <span className={`text-[11px] font-semibold  px-2.5 py-1 rounded-full 
                                                   border ${si.tw}`}>
                                    {si.label}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <div className="flex items-center gap-1.5">
                                  <IconCalendar className={`w-3.5 h-3.5 ${bracket.dateText}`} />
                                  <span className={`text-sm  font-medium ${bracket.dateText}`}>
                                    {formatDate(row.followup_date)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <span className={`inline-flex items-center gap-1.5 text-sm  font-bold 
                                                 px-2.5 py-1 rounded-lg border ${bracket.badgeBg} ${bracket.badgeText} 
                                                 ${bracket.badgeBorder}`}>
                                  <IconClock className="w-3 h-3" />
                                  {days}d overdue
                                </span>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300">
                                <div className="flex items-center gap-2">
                                  <IconUser className="text-gray-400 w-3 h-3 shrink-0" />
                                  <span className="text-sm text-gray-700">{row.employee_name || '—'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 border-2 border-gray-300 text-center">
                                <button
                                  onClick={() => setHistoryModal(row)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                                             border-2 border-gray-300 bg-white text-gray-600 text-xs font-semibold
                                             hover:bg-gray-50 hover:border-gray-400 transition-colors
                                             focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-95"
                                >
                                  <IconHistory className="w-3.5 h-3.5" />
                                  <span>History</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tablet Table (simplified) */}
                  <div className="hidden sm:block lg:hidden overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Company', 'Contact', 'Stage', 'Due Date', 'Overdue', 'Actions'].map(h => (
                            <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 
                                                    uppercase tracking-wider border-b-2 border-gray-200 
                                                   whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const si = stageInfo(row.current_stage);
                          const days = daysSince(row.followup_date);
                          return (
                            <tr
                              key={row.id}
                              className={`${i % 2 === 0 ? 'bg-white' : bracket.rowStripe} 
                                         hover:bg-gray-50 transition-colors border-l-4 ${bracket.accentColor}`}
                            >
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{row.company_name}</p>
                                <p className="text-[11px]  text-gray-400 mt-0.5">{row.phone_number}</p>
                              </td>
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                <p className="text-sm text-gray-700">{row.customer_name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{row.employee_name || '—'}</p>
                              </td>
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                {si?.key ? (
                                  <span className={`text-[10px] font-semibold  px-2 py-0.5 rounded-full 
                                                   border ${si.tw}`}>
                                    {si.label}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                <span className={`text-xs  ${bracket.dateText}`}>
                                  {formatDate(row.followup_date)}
                                </span>
                              </td>
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                <span className={`text-xs  font-bold px-2 py-0.5 rounded-md 
                                                 ${bracket.badgeBg} ${bracket.badgeText}`}>
                                  {days}d
                                </span>
                              </td>
                              <td className="px-3 py-3 border-b-2 border-gray-100">
                                <button
                                  onClick={() => setHistoryModal(row)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg 
                                             border-2 border-gray-300 bg-white text-gray-600 text-[11px] font-semibold
                                             hover:bg-gray-50 transition-colors active:scale-95"
                                >
                                  <IconHistory className="w-3 h-3" />
                                  History
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden divide-y-2 divide-gray-100">
                    {rows.map((row) => {
                      const si = stageInfo(row.current_stage);
                      const days = daysSince(row.followup_date);
                      return (
                        <div
                          key={row.id}
                          className={`p-4 border-l-4 ${bracket.accentColor}`}
                        >
                          {/* Top row: Company + Overdue badge */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <IconBuilding className="text-gray-400 w-3.5 h-3.5 shrink-0" />
                                <span className="text-sm font-bold text-gray-900 truncate">{row.company_name}</span>
                              </div>
                            </div>
                            <span className={`shrink-0 text-[11px]  font-bold px-2.5 py-1 rounded-lg 
                                             border ${bracket.badgeBg} ${bracket.badgeText} ${bracket.badgeBorder}`}>
                              <span className="flex items-center gap-1">
                                <IconClock className="w-3 h-3" />
                                {days}d
                              </span>
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2">
                              <IconUser className="text-gray-400 w-3 h-3" />
                              <span className="text-sm text-gray-700">{row.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IconPhone className="text-gray-400 w-3 h-3" />
                              <span className="text-sm  text-gray-600">{row.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IconCalendar className={`w-3 h-3 ${bracket.dateText}`} />
                              <span className={`text-sm  ${bracket.dateText}`}>
                                Due: {formatDate(row.followup_date)}
                              </span>
                            </div>
                          </div>

                          {/* Bottom: Stage + Assigned + History */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {si?.key && (
                                <span className={`text-[10px] font-semibold  px-2 py-0.5 rounded-full 
                                                 border ${si.tw}`}>
                                  {si.label}
                                </span>
                              )}
                              {row.employee_name && (
                                <span className="text-[11px] text-gray-400  truncate">
                                  → {row.employee_name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setHistoryModal(row)}
                              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg 
                                         border-2 border-gray-300 bg-white text-gray-600 text-[11px] font-semibold
                                         hover:bg-gray-50 transition-colors active:scale-95"
                            >
                              <IconHistory className="w-3 h-3" />
                              History
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <HistoryModal
          customerId={historyModal.id}
          companyName={historyModal.company_name}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}