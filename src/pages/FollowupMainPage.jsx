import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { followupApi } from '../services/api';
import { useToast } from '../components/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'first_followup', label: 'First Follow-up', color: 'indigo', tw: 'bg-indigo-100 text-indigo-700 border-indigo-300', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-500', badge: 'bg-indigo-600' },
  { key: 'proposal', label: 'Proposal', color: 'amber', tw: 'bg-amber-100 text-amber-700 border-amber-300', activeBg: 'bg-amber-50', activeBorder: 'border-amber-500', badge: 'bg-amber-500' },
  { key: 'lead', label: 'Lead', color: 'emerald', tw: 'bg-emerald-100 text-emerald-700 border-emerald-300', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-500', badge: 'bg-emerald-600' },
  { key: 'confirm', label: 'Confirm', color: 'blue', tw: 'bg-blue-100 text-blue-700 border-blue-300', activeBg: 'bg-blue-50', activeBorder: 'border-blue-500', badge: 'bg-blue-600' },
];

const SEARCH_FIELDS = [
  { key: 'all', label: 'All Fields' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'customer_name', label: 'Contact Name' },
  { key: 'phone_number', label: 'Phone Number' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Card status logic ───────────────────────────────────────────────────────
function getCardStatus(row, selectedDate) {
  const followupDate = row.followup_date?.split('T')[0];
  const today = todayStr();

  // Cards in the scheduled grid have followup_date === selectedDate.
  // They should NEVER show as "missed" — only pending / done / delayed.
  // Only rows in the missed list (followup_date < selectedDate, no log) are missed.
  // We detect that by checking if followupDate is strictly before today
  // AND the row has no log on selectedDate AND followupDate !== selectedDate.
  const isScheduledForSelectedDate = followupDate === selectedDate;

  if (!isScheduledForSelectedDate && followupDate < today && !row.log_on_selected_date_id) {
    return 'missed';
  }

  if (row.log_on_selected_date_id) {
    const logDate = row.last_log_date?.split('T')[0];
    if (logDate && logDate <= followupDate) return 'done';
    return 'delayed';
  }
  return 'pending';
}

const STATUS_CONFIG = {
  missed: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-500',
    badgeText: 'Missed',
    ring: 'ring-red-200',
  },
  done: {
    border: 'border-green-400',
    bg: 'bg-green-50',
    badge: 'bg-green-500',
    badgeText: 'Completed',
    ring: 'ring-green-200',
  },
  delayed: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    badge: 'bg-blue-500',
    badgeText: 'Delayed',
    ring: 'ring-blue-200',
  },
  // pending = scheduled for selected date, no log yet
  // If selected date === today we label it "Due Today", otherwise "Scheduled"
  pending: {
    border: 'border-gray-300',
    bg: 'bg-white',
    badge: 'bg-gray-400',
    badgeText: 'Due Today',
    ring: 'ring-gray-200',
  },
};

// Adjust badge text for cards that are scheduled on a future/past-but-selected date
function resolveBadgeText(status, followupDate, selectedDate) {
  if (status !== 'pending') return STATUS_CONFIG[status].badgeText;
  if (followupDate === todayStr()) return 'Due Today';
  if (followupDate > todayStr()) return 'Scheduled';
  // followupDate < today but it's in the scheduled list means the user
  // is viewing a past date — show as overdue rather than missed
  return 'Overdue';
}

// ─── Icons (Lucide-style inline SVGs) ─────────────────────────────────────────
const Icon = ({ children, className = '' }) => (
  <svg
    className={`shrink-0 ${className}`}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const IconCalendar = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

const IconSearch = ({ className }) => (
  <Icon className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

const IconEye = ({ className }) => (
  <Icon className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const IconHistory = ({ className }) => (
  <Icon className={className}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
  </Icon>
);

const IconPhone = ({ className }) => (
  <Icon className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.3a16 16 0 0 0 5.8 5.8l.91-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

const IconBuilding = ({ className }) => (
  <Icon className={className}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </Icon>
);

const IconUser = ({ className }) => (
  <Icon className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const IconNote = ({ className }) => (
  <Icon className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </Icon>
);

const IconClose = ({ className }) => (
  <Icon className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

const IconChevronDown = ({ className }) => (
  <Icon className={className}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

const IconAlertTriangle = ({ className }) => (
  <Icon className={className}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);

const IconFilter = ({ className }) => (
  <Icon className={className}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Icon>
);

const IconCheck = ({ className }) => (
  <Icon className={className}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

// ─── Search Filter Dropdown ───────────────────────────────────────────────────
function SearchFilterDropdown({ selectedField, onSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = SEARCH_FIELDS.find((f) => f.key === selectedField);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 
                   border-2 border-gray-300 rounded-l-xl text-sm font-semibold text-gray-700 
                   transition-colors whitespace-nowrap focus:outline-none focus:ring-2 
                   focus:ring-indigo-400 focus:border-indigo-400 min-w-[140px] sm:min-w-[160px]"
        type="button"
      >
        <IconFilter className="text-gray-500 w-3.5 h-3.5" />
        <span className="hidden sm:inline">{selected?.label}</span>
        <span className="sm:hidden">{selected?.key === 'all' ? 'All' : selected?.label?.split(' ')[0]}</span>
        <IconChevronDown
          className={`text-gray-400 w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-52 bg-white border-2 border-gray-200 
                      rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1"
        >
          {SEARCH_FIELDS.map((field) => (
            <button
              key={field.key}
              onClick={() => {
                onSelect(field.key);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm 
                          transition-colors text-left hover:bg-gray-50
                          ${selectedField === field.key
                  ? 'text-indigo-700 font-semibold bg-indigo-50'
                  : 'text-gray-700'
                }`}
            >
              <span>{field.label}</span>
              {selectedField === field.key && (
                <IconCheck className="text-indigo-600 w-4 h-4" />
              )}
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

  const stageLabel = (s) => STAGES.find((st) => st.key === s)?.label || s;
  const stageConfig = (s) => STAGES.find((st) => st.key === s);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-2 border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b-2 border-gray-200">
          <div>
            <p className="text-xs  text-gray-500 mb-1 tracking-wide uppercase">
              Follow-up History
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{companyName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 
                       hover:text-gray-700 transition-colors border-2 border-gray-200"
          >
            <IconClose />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="mt-4  text-sm">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-400  text-sm">
            No history found for this customer.
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            {/* Desktop Table */}
            <table className="w-full border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50">
                  {['Date', 'Stage', 'Contact', 'Phone', 'Remarks', 'Next Follow-up', 'By'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 
                                    uppercase tracking-wider border-b-2 border-gray-200 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50/30 transition-colors`}
                  >
                    <td className="px-4 py-3 border-b-2 border-gray-100">
                      <span className=" text-xs text-gray-700">
                        {new Date(row.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100">
                      <span className={`text-[11px] font-semibold  px-2.5 py-1 rounded-full ${stageConfig(row.followup_stage)?.tw || 'bg-gray-100 text-gray-600'}`}>
                        {stageLabel(row.followup_stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100 text-sm text-gray-700">
                      {row.contact_name}
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100">
                      <span className=" text-xs text-gray-600">{row.contact_phone}</span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100 max-w-[200px]">
                      <span className="text-xs text-gray-500 line-clamp-2">
                        {row.remarks || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100">
                      <span className=" text-xs text-gray-600">
                        {row.next_followup_date ? formatDate(row.next_followup_date) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b-2 border-gray-100 text-sm text-gray-700">
                      {row.employee_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y-2 divide-gray-100">
              {history.map((row) => (
                <div key={row.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className=" text-xs text-gray-500">
                      {new Date(row.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className={`text-[11px] font-semibold  px-2.5 py-0.5 rounded-full ${stageConfig(row.followup_stage)?.tw || 'bg-gray-100 text-gray-600'}`}>
                      {stageLabel(row.followup_stage)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 font-medium">{row.contact_name}</div>
                  <div className=" text-xs text-gray-500">{row.contact_phone}</div>
                  {row.remarks && (
                    <p className="text-xs text-gray-500 line-clamp-2">{row.remarks}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Next: {row.next_followup_date ? formatDate(row.next_followup_date) : '—'}</span>
                    <span>By: {row.employee_name || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Follow-up Card ───────────────────────────────────────────────────────────
function FollowupCard({ row, selectedDate, onView, onHistory }) {
  const status = getCardStatus(row, selectedDate);
  const s = STATUS_CONFIG[status];
  const stage = STAGES.find((st) => st.key === row.current_stage);

  return (
    <div
      className={`border-2 ${s.border} ${s.bg} rounded-2xl p-4 sm:p-5 flex flex-col gap-3 
                  transition-all duration-200 hover:shadow-lg hover:ring-2 ${s.ring} 
                  hover:-translate-y-0.5 relative group`}
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <span
          className={`text-[10px] font-bold  ${s.badge} text-white 
                      px-2.5 py-1 rounded-full tracking-wide uppercase`}
        >
          {resolveBadgeText(status, row.followup_date?.split('T')[0], selectedDate)}
        </span>
      </div>

      {/* Company + stage */}
      <div className="pr-20 sm:pr-24">
        <div className="flex items-center gap-2 mb-1.5">
          <IconBuilding className="text-gray-400 w-4 h-4 shrink-0" />
          <span className="text-sm sm:text-[15px] font-bold text-gray-900 truncate">
            {row.company_name}
          </span>
        </div>
        {stage && (
          <span
            className={`text-[10px] font-semibold  px-2.5 py-0.5 rounded-full ${stage.tw}`}
          >
            {stage.label}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <IconUser className="text-gray-400 w-3.5 h-3.5" />
          <span className="text-sm text-gray-700">{row.customer_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconPhone className="text-gray-400 w-3.5 h-3.5" />
          <span className="text-sm  text-gray-700">{row.phone_number}</span>
        </div>
        {row.remarks && (
          <div className="flex items-start gap-2">
            <IconNote className="text-gray-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
              {row.remarks}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <IconCalendar className="text-gray-400 w-3.5 h-3.5" />
          <span className="text-xs  text-gray-500">
            Follow-up: {formatDate(row.followup_date)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1 pt-3 border-t-2 border-gray-100">
        <button
          onClick={() => onView(row)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-indigo-300 
                     bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 
                     hover:border-indigo-400 transition-colors focus:outline-none focus:ring-2 
                     focus:ring-indigo-300"
        >
          <IconEye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
        <button
          onClick={() => onHistory(row)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-gray-300 
                     bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 
                     hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 
                     focus:ring-gray-300"
        >
          <IconHistory className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label, success }) {
  return (
    <div className={`text-center py-16 px-6 ${success ? 'text-emerald-500' : 'text-gray-400'}`}>
      <div className="mb-4 flex justify-center">
        {success ? (
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm ">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FollowupMainPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeStage, setActiveStage] = useState('first_followup');
  const [data, setData] = useState({ grouped: {}, missed: [] });
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Reset data immediately so stale grouped entries from a previous date/tab
    // never bleed into the newly selected stage while the request is in-flight.
    setData({ grouped: {}, missed: [] });
    try {
      const res = await followupApi.getByDate({
        date: selectedDate,
        search: debouncedSearch,
        searchField: searchField,
      });
      if (res.success) setData(res.data);
    } catch {
      addToast('Failed to load follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, debouncedSearch, searchField]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (row) => {
    navigate(`/followup/${row.id}`, { state: { customer: row } });
  };
  const handleHistory = (row) => setHistoryModal(row);

  const currentStageData = data.grouped?.[activeStage] || [];

  // Total count across all stages
  const totalScheduled = STAGES.reduce(
    (acc, stage) => acc + (data.grouped?.[stage.key]?.length || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-sans">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Follow-up Manager
        </h1>
        <p className="text-sm text-gray-500 mt-1.5  tracking-wide">
          Track and manage customer follow-ups by date and stage
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3.5 py-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">
              {totalScheduled} Scheduled
            </span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl px-3.5 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-red-700">
              {data.missed?.length || 0} Missed
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-3.5 py-2">
            <IconCalendar className="text-gray-500 w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-gray-600 ">
              {formatDate(selectedDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Date Picker */}
        <div
          className="flex items-center gap-2.5 bg-white border-2 border-gray-300 rounded-xl 
                      px-3.5 py-2.5 shadow-sm hover:border-gray-400 transition-colors 
                      focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
        >
          <IconCalendar className="text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none outline-none text-sm  text-gray-700 bg-transparent 
                       cursor-pointer w-full"
          />
        </div>

        {/* Search with Dropdown Filter */}
        <div className="flex flex-1 min-w-0 max-w-xl">
          <SearchFilterDropdown selectedField={searchField} onSelect={setSearchField} />
          <div
            className="flex items-center gap-2.5 bg-white border-2 border-l-0 border-gray-300 
                        rounded-r-xl px-3.5 py-2.5 shadow-sm flex-1 min-w-0
                        hover:border-gray-400 transition-colors 
                        focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
          >
            <IconSearch className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={
                searchField === 'all'
                  ? 'Search across all fields…'
                  : `Search by ${SEARCH_FIELDS.find((f) => f.key === searchField)?.label?.toLowerCase()}…`
              }
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

        {/* Today shortcut */}
        {selectedDate !== todayStr() && (
          <button
            onClick={() => setSelectedDate(todayStr())}
            className="px-4 py-2.5 rounded-xl border-2 border-indigo-300 bg-indigo-50 
                       text-indigo-700 text-sm font-semibold hover:bg-indigo-100 
                       hover:border-indigo-400 transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-indigo-300 whitespace-nowrap self-start sm:self-auto"
          >
            ← Today
          </button>
        )}
      </div>

      {/* Stage Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-6 gap-0.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage) => {
          const count = data.grouped?.[stage.key]?.length || 0;
          const active = activeStage === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm cursor-pointer 
                          border-b-[3px] rounded-t-lg transition-all whitespace-nowrap
                          ${active
                  ? `${stage.activeBorder} ${stage.activeBg} font-bold`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className={active ? '' : 'font-medium'}>{stage.label}</span>
              <span
                className={`text-[11px]  px-2 py-0.5 rounded-full
                            ${active
                    ? `${stage.badge} text-white`
                    : 'bg-gray-200 text-gray-600'
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Missed tab */}
        <button
          onClick={() => setActiveStage('missed')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm cursor-pointer 
                      border-b-[3px] rounded-t-lg transition-all whitespace-nowrap
                      ${activeStage === 'missed'
              ? 'border-red-500 bg-red-50 font-bold text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          <IconAlertTriangle className={`w-3.5 h-3.5 ${activeStage === 'missed' ? 'text-red-500' : 'text-gray-400'}`} />
          <span className={activeStage === 'missed' ? '' : 'font-medium'}>Missed</span>
          <span
            className={`text-[11px]  px-2 py-0.5 rounded-full
                        ${activeStage === 'missed'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-600'
              }`}
          >
            {data.missed?.length || 0}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-400  text-sm">Loading follow-ups…</p>
        </div>
      ) : (
        <>
          {/* Scheduled (selected stage) */}
          {activeStage !== 'missed' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div
                  className={`w-1.5 h-6 rounded-full`}
                  style={{
                    backgroundColor:
                      STAGES.find((s) => s.key === activeStage)?.color === 'indigo'
                        ? '#6366f1'
                        : STAGES.find((s) => s.key === activeStage)?.color === 'amber'
                          ? '#f59e0b'
                          : STAGES.find((s) => s.key === activeStage)?.color === 'emerald'
                            ? '#10b981'
                            : '#3b82f6',
                  }}
                />
                <span className="text-base font-bold text-gray-800">
                  {STAGES.find((s) => s.key === activeStage)?.label}
                </span>
                <span className="text-xs  text-gray-400 ml-1">
                  {formatDate(selectedDate)}
                </span>
              </div>

              {currentStageData.length === 0 ? (
                <EmptyState label="No follow-ups scheduled for this stage on the selected date." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {currentStageData.map((row) => (
                    <FollowupCard
                      key={row.id}
                      row={row}
                      selectedDate={selectedDate}
                      onView={handleView}
                      onHistory={handleHistory}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Missed */}
          {activeStage === 'missed' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-6 rounded-full bg-red-500" />
                <IconAlertTriangle className="text-red-500 w-4 h-4" />
                <span className="text-base font-bold text-red-700">Missed Follow-ups</span>
                <span className="text-xs  text-gray-400 ml-1">
                  before {formatDate(selectedDate)}
                </span>
              </div>

              {data.missed?.length === 0 ? (
                <EmptyState label="No missed follow-ups before the selected date." success />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.missed.map((row) => (
                    <FollowupCard
                      key={row.id}
                      row={row}
                      selectedDate={selectedDate}
                      onView={handleView}
                      onHistory={handleHistory}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
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