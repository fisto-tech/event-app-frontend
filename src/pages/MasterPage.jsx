import React, { useState, useEffect } from 'react';
import { masterApi } from '../services/api';
import { useToast } from '../components/Toast';

import {
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  LinkIcon
} from "@heroicons/react/24/outline";

const TABS = [
  {
    key: "sources",
    label: "Sources",
    icon: <LinkIcon className="w-5 h-5" />,
    description: "View and manage custom sources entered by users",
  },
  {
    key: "expos",
    label: "Expo Names",
    icon: <BuildingStorefrontIcon className="w-5 h-5" />,
    description: "Manage exhibition and expo entries",
  },
  {
    key: "enquiry",
    label: "Enquiry Types",
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    description: "Define enquiry categories",
  },
  {
    key: "industry",
    label: "Industry Types",
    icon: <BuildingOffice2Icon className="w-5 h-5" />,
    description: "Manage industry classifications",
  },
  {
    key: "sms",
    label: "SMS Templates",
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    description: "Create and manage SMS templates",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Templates",
    icon: <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />,
    description: "WhatsApp message templates",
  },
];

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium text-sm">No {label} found</p>
      <p className="text-gray-800 text-xs mt-1">Add your first entry using the form above</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin"></div>
      </div>
      <p className="text-gray-800 text-sm">Loading data...</p>
    </div>
  );
}

// ─── SOURCES READ-ONLY COMPONENT ──────────────────────────────────────────────
function SourcesTab({ data, loading, onRefresh }) {
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-sm">All Sources</h3>
            <button
              onClick={onRefresh}
              className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              {data.length}
            </span>
          </div>
        </div>

        {data.length === 0 ? (
          <EmptyState label="sources" />
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.source_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {item.source_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Note:</strong> These sources are automatically created when users enter custom values in the "Others" field during customer registration. Deletion is not allowed to maintain data integrity.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SELECTED EXPO HELPERS ────────────────────────────────────────────────────
const SELECTED_EXPO_KEY = 'selectedExpo';
export function getSelectedExpo() {
  try { return JSON.parse(localStorage.getItem(SELECTED_EXPO_KEY)) || null; } catch { return null; }
}
export function cacheSelectedExpo(expo) {
  // Cache in localStorage for offline use — source of truth is the DB
  if (expo) localStorage.setItem(SELECTED_EXPO_KEY, JSON.stringify(expo));
  else localStorage.removeItem(SELECTED_EXPO_KEY);
}


// ─── Shared chevron icon (defined outside components to avoid remount issues) ──
function ChevronDown() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <svg className="w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ─── Multi-Date Picker ────────────────────────────────────────────────────────
// ─── Inline Calendar Multi-Date Picker ───────────────────────────────────────
function MultiDatePicker({ dates = [], onChange }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  // 'calendar' | 'month' | 'year'
  const [view, setView] = useState('calendar');
  // year-grid start (shows 12 years at a time)
  const [yearStart, setYearStart] = useState(Math.floor(today.getFullYear() / 12) * 12);

  const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const toggle = (key) => {
    if (dates.includes(key)) onChange(dates.filter(x => x !== key));
    else onChange([...dates, key].sort());
  };

  const formatDisplay = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      {/* Selected date chips */}
      {dates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d) => (
            <span key={d}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDisplay(d)}
              <button type="button" onClick={() => toggle(d)}
                className="text-blue-400 hover:text-red-500 transition-colors leading-none font-bold">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Inline calendar */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white select-none">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          {/* Prev arrow — hides in month/year picker views */}
          {view === 'calendar' ? (
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : view === 'year' ? (
            <button type="button" onClick={() => setYearStart(s => s - 12)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-7" /> /* spacer for month view */
          )}

          {/* Month + Year labels — clickable */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView(v => v === 'month' ? 'calendar' : 'month')}
              className={`px-2 py-1 rounded-lg text-sm font-semibold transition-all ${
                view === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-800 hover:bg-gray-200'
              }`}
            >
              {MONTHS[viewMonth]}
            </button>
            <button
              type="button"
              onClick={() => {
                setYearStart(Math.floor(viewYear / 12) * 12);
                setView(v => v === 'year' ? 'calendar' : 'year');
              }}
              className={`px-2 py-1 rounded-lg text-sm font-semibold transition-all ${
                view === 'year' ? 'bg-blue-100 text-blue-700' : 'text-gray-800 hover:bg-gray-200'
              }`}
            >
              {viewYear}
            </button>
          </div>

          {/* Next arrow */}
          {view === 'calendar' ? (
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : view === 'year' ? (
            <button type="button" onClick={() => setYearStart(s => s + 12)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-7" /> /* spacer for month view */
          )}
        </div>

        {/* ── Month Picker ── */}
        {view === 'month' && (
          <div className="p-3 grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => { setViewMonth(i); setView('calendar'); }}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  i === viewMonth
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {MONTHS_FULL[i]}
              </button>
            ))}
          </div>
        )}

        {/* ── Year Picker ── */}
        {view === 'year' && (
          <div className="p-3 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => yearStart + i).map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => { setViewYear(yr); setView('calendar'); }}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  yr === viewYear
                    ? 'bg-blue-600 text-white shadow-sm'
                    : yr === today.getFullYear()
                      ? 'border border-blue-400 text-blue-600 hover:bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        )}

        {/* ── Calendar Grid ── */}
        {view === 'calendar' && (
          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11.5px] font-semibold text-gray-800 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />;
                const key = toKey(viewYear, viewMonth, day);
                const selected = dates.includes(key);
                const isToday  = key === toKey(today.getFullYear(), today.getMonth(), today.getDate());
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`
                      relative h-8 w-full rounded-lg text-xs font-medium transition-all duration-150
                      ${selected
                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                        : isToday
                          ? 'border border-blue-400 text-blue-600 hover:bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {day}
                    {selected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-3 pb-3 text-center">
          {dates.length > 0 ? (
            <p className="text-[11.5px] text-gray-800">
              {dates.length} date{dates.length !== 1 ? 's' : ''} selected — click a date to toggle
            </p>
          ) : (
            <p className="text-[11.5px] text-gray-800">Click any date to select it</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EXPO TAB (dedicated — has name + dates + remarks) ───────────────────────
function ExpoTab({
  data, loading, onAdd, onUpdate, onDelete,
  onSetCurrentExpo, currentExpoFromParent, onRefresh,
}) {
  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200';

  const BLANK = { expo_name: '', conduct_dates: [], remarks: '' };
  const [form, setForm]               = useState(BLANK);
  const [editingId, setEditingId]     = useState(null); // null = add mode, id = edit mode
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [settingId, setSettingId]     = useState(null);
  const [currentExpo, setCurrentExpo] = useState(() => getSelectedExpo());

  useEffect(() => { if (currentExpoFromParent !== undefined) setCurrentExpo(currentExpoFromParent); }, [currentExpoFromParent]);

  const isFormValid = form.expo_name.trim().length > 0;

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      expo_name: item.expo_name,
      conduct_dates: Array.isArray(item.conduct_dates) ? item.conduct_dates : [],
      remarks: item.remarks || '',
    });
    // Scroll to top of form
    document.getElementById('expo-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => { setEditingId(null); setForm(BLANK); };

  const handleSave = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, form);
        setEditingId(null);
      } else {
        await onAdd(form);
      }
      setForm(BLANK);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); setShowConfirm(null); }
  };

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pb-2">

      {/* ── Add / Edit Expo Form ── */}
      <div id="expo-form-top" className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${editingId ? 'border-amber-300' : 'border-gray-200'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${editingId ? 'bg-gradient-to-r from-amber-50 to-white border-amber-100' : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'}`}>
          <h3 className={`font-semibold text-sm ${editingId ? 'text-amber-800' : 'text-gray-800'}`}>
            {editingId ? '✏️ Edit Expo' : 'Add New Expo'}
          </h3>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-all font-medium">
              Cancel
            </button>
          )}
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">
                  Expo Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tech Expo 2026"
                  value={form.expo_name}
                  onChange={(e) => setForm({ ...form, expo_name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && isFormValid && !saving) handleSave(); }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">
                  Remarks / Notes
                  <span className="text-gray-800 font-normal normal-case ml-1 text-[11.5px]">(optional)</span>
                </label>
                <textarea
                  placeholder="Any notes about this expo..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className={`${inputCls} resize-none`}
                  rows={4}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">
                Date(s) of Conduct
                <span className="text-gray-800 font-normal normal-case ml-1 text-[11.5px]">(optional, multiple)</span>
              </label>
              <MultiDatePicker
                dates={form.conduct_dates}
                onChange={(dates) => setForm({ ...form, conduct_dates: dates })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !isFormValid}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isFormValid && !saving
                  ? editingId ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-100 text-gray-800 cursor-not-allowed'
              }`}
            >
              {saving
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                : editingId
                  ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Update Expo</>
                  : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Add Expo</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expo List ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Expo Names</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-medium">{data.length}</span>
          </div>
        </div>
        {loading ? <LoadingState /> : data.length === 0 ? <EmptyState label="expos" /> : (
          <div className="divide-y divide-gray-100">
            {data.map((item, index) => {
              const isSelected = currentExpo?.id === item.id;
              const isBeingEdited = editingId === item.id;
              const dates = Array.isArray(item.conduct_dates) ? item.conduct_dates : [];
              return (
                <div key={item.id}
                  className={`px-6 py-4 flex items-start transition-colors group ${isBeingEdited ? 'bg-amber-50/60' : isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}>
                  <div className="w-6 flex-shrink-0 mr-3 mt-0.5">
                    <span className="text-xs font-semibold text-gray-800">{index + 1}.</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{item.expo_name}</p>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Current Expo
                        </span>
                      )}
                      {isBeingEdited && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Editing...</span>
                      )}
                    </div>
                    {dates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {dates.map(d => (
                          <span key={d} className="inline-flex items-center gap-1 text-[11.5px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.remarks && <p className="text-xs text-gray-500 mt-1 italic">"{item.remarks}"</p>}
                    <p className="text-xs text-gray-800 mt-1">Added {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                    {!isSelected ? (
                      <button
                        onClick={async () => {
                          setSettingId(item.id);
                          try {
                            await onSetCurrentExpo(item.id);
                            cacheSelectedExpo({ id: item.id, expo_name: item.expo_name });
                            setCurrentExpo({ id: item.id, expo_name: item.expo_name });
                          } finally { setSettingId(null); }
                        }}
                        disabled={settingId === item.id}
                        className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all font-medium whitespace-nowrap disabled:opacity-50"
                      >
                        {settingId === item.id ? '...' : 'Set Current'}
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setSettingId(item.id);
                          try { await onSetCurrentExpo(null); cacheSelectedExpo(null); setCurrentExpo(null); }
                          finally { setSettingId(null); }
                        }}
                        disabled={settingId === item.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all font-medium whitespace-nowrap disabled:opacity-50"
                      >
                        {settingId === item.id ? '...' : 'Clear'}
                      </button>
                    )}
                    {/* Edit button */}
                    {!isBeingEdited && (
                      <button
                        onClick={() => startEdit(item)}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {/* Delete button */}
                    {showConfirm === item.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowConfirm(null)} className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                          {deletingId === item.id ? 'Deleting...' : 'Confirm'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowConfirm(item.id)}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-800 hover:text-red-600 hover:bg-red-50 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIMPLE LIST TAB ──────────────────────────────────────────────────────────
function SimpleListTab({
  data, onAdd, onUpdate, onDelete, loading, fields, addLabel, tabLabel,
  isDeletable = true, isExpoTab = false, onSetCurrentExpo,
  isCustomizable = false, expos = [], enquiryTypes = [], industryTypes = [],
  onAddCustom, onUpdateCustom, customData = [], customLoading = false, onDeleteCustom,
  activeTab, onRefresh,
}) {
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [currentExpo, setCurrentExpo] = useState(() => getSelectedExpo());
  const [settingId, setSettingId] = useState(null);

  // Inline edit for the base list (sms/whatsapp general templates)
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline edit for custom entries list (enquiry/industry)
  const [editingCustomItem, setEditingCustomItem] = useState(null);
  const [editCustomForm, setEditCustomForm] = useState({});
  const [savingCustomEdit, setSavingCustomEdit] = useState(false);

  // Unified add form for customizable tabs
  const [customExpoId, setCustomExpoId] = useState('');
  const [customEnquiryId, setCustomEnquiryId] = useState('');
  const [customIndustryId, setCustomIndustryId] = useState('');
  const [customForm, setCustomForm] = useState({});
  const [addingCustom, setAddingCustom] = useState(false);
  const [deletingCustomId, setDeletingCustomId] = useState(null);

  // Scoped enquiry/industry lists for sms/whatsapp — refreshed when expo changes
  const [scopedEnquiryTypes, setScopedEnquiryTypes] = useState(enquiryTypes);
  const [scopedIndustryTypes, setScopedIndustryTypes] = useState(industryTypes);

  // When expo selection changes on sms/whatsapp tabs, re-fetch scoped lists from server
  useEffect(() => {
    if (activeTab !== 'sms' && activeTab !== 'whatsapp') return;
    if (!customExpoId) {
      // Expo blank = general: reset to base prop lists, clear dependent selects
      setScopedEnquiryTypes(enquiryTypes);
      setScopedIndustryTypes(industryTypes);
      setCustomEnquiryId('');
      setCustomIndustryId('');
      return;
    }
    // Expo chosen: fetch scoped enquiry+industry from server
    const apiCall = activeTab === 'sms'
      ? masterApi.getSmsTemplatesForContext(customExpoId)
      : masterApi.getWhatsappTemplatesForContext(customExpoId);
    apiCall
      .then(res => {
        const d = res.data.data;
        setScopedEnquiryTypes(d.enquiryTypes || enquiryTypes);
        setScopedIndustryTypes(d.industryTypes || industryTypes);
      })
      .catch(() => {});
    setCustomEnquiryId('');
    setCustomIndustryId('');
  }, [customExpoId, activeTab]);

  // Keep scoped lists in sync if base props update (e.g. on first load) when no expo chosen
  useEffect(() => {
    if (!customExpoId) {
      setScopedEnquiryTypes(enquiryTypes);
      setScopedIndustryTypes(industryTypes);
    }
  }, [enquiryTypes, industryTypes]);

  // Filter for viewing custom entries
  const [filterExpoId, setFilterExpoId] = useState('');
  const [filterEnquiryId, setFilterEnquiryId] = useState('');
  const [filterIndustryId, setFilterIndustryId] = useState('');

  const isFormValid = fields.every((f) => form[f.name]?.trim());
  const isCustomFormValid = fields.every((f) => customForm[f.name]?.trim());

  const handleAdd = async () => {
    if (!isFormValid) return;
    setAdding(true);
    try { await onAdd(form); setForm({}); } finally { setAdding(false); }
  };

  const handleAddCustom = async () => {
    if (!isCustomFormValid) return;
    setAddingCustom(true);
    try {
      await onAddCustom({
        ...customForm,
        expo_id: customExpoId || null,
        enquiry_type_id: customEnquiryId || null,
        industry_type_id: customIndustryId || null,
      });
      setCustomForm({});
    } finally { setAddingCustom(false); }
  };

  // Save edit for base list items (sms/whatsapp general templates)
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      await onUpdate(editingItem.id, editForm);
      setEditingItem(null);
      setEditForm({});
    } finally { setSavingEdit(false); }
  };

  // Save edit for custom entries (enquiry/industry)
  const handleSaveCustomEdit = async () => {
    if (!editingCustomItem) return;
    setSavingCustomEdit(true);
    try {
      const formData = {
        ...editCustomForm,
        enquiry_type_id: editingCustomItem.enquiry_type_id || null,
        industry_type_id: editingCustomItem.industry_type_id || null,
      };
      await onUpdateCustom(editingCustomItem.id, formData);
      setEditingCustomItem(null);
      setEditCustomForm({});
    } finally { setSavingCustomEdit(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); setShowConfirm(null); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && isFormValid && !adding) handleAdd(); };

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  // Scoped lists for the filter bar — driven by filterExpoId
  const [filterScopedEnquiryTypes, setFilterScopedEnquiryTypes] = useState(enquiryTypes);
  const [filterScopedIndustryTypes, setFilterScopedIndustryTypes] = useState(industryTypes);

  useEffect(() => {
    if (activeTab !== 'sms' && activeTab !== 'whatsapp') return;
    if (!filterExpoId || filterExpoId === '__general__') {
      setFilterScopedEnquiryTypes(enquiryTypes);
      setFilterScopedIndustryTypes(industryTypes);
      setFilterEnquiryId('');
      setFilterIndustryId('');
      return;
    }
    const apiCall = activeTab === 'sms'
      ? masterApi.getSmsTemplatesForContext(filterExpoId)
      : masterApi.getWhatsappTemplatesForContext(filterExpoId);
    apiCall
      .then(res => {
        const d = res.data.data;
        setFilterScopedEnquiryTypes(d.enquiryTypes || enquiryTypes);
        setFilterScopedIndustryTypes(d.industryTypes || industryTypes);
      })
      .catch(() => {});
    setFilterEnquiryId('');
    setFilterIndustryId('');
  }, [filterExpoId, activeTab]);

  useEffect(() => {
    if (!filterExpoId || filterExpoId === '__general__') {
      setFilterScopedEnquiryTypes(enquiryTypes);
      setFilterScopedIndustryTypes(industryTypes);
    }
  }, [enquiryTypes, industryTypes]);

  // Filter custom entries for display
  const shownCustom = customData.filter(item => {
    if (filterExpoId === '__general__' && item.expo_id != null) return false;
    if (filterExpoId && filterExpoId !== '__general__' && String(item.expo_id) !== String(filterExpoId)) return false;
    if (filterEnquiryId === '__general__' && item.enquiry_type_id != null) return false;
    if (filterEnquiryId && filterEnquiryId !== '__general__' && String(item.enquiry_type_id) !== String(filterEnquiryId)) return false;
    if (filterIndustryId === '__general__' && item.industry_type_id != null) return false;
    if (filterIndustryId && filterIndustryId !== '__general__' && String(item.industry_type_id) !== String(filterIndustryId)) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pb-2">

      {/* ══ CUSTOMIZABLE TABS: single unified add form ══ */}
      {isCustomizable ? (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
             
              <h3 className="font-semibold text-blue-800 text-sm">{addLabel}</h3>
            </div>
            <span className="text-[11.5px] uppercase tracking-wider text-blue-800 font-semibold hidden sm:block">
              Leave expo blank = General (all expos)
            </span>
          </div>
          <div className="p-6 space-y-4">
            {/* Context selectors — vary by tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Expo — always shown */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Expo{' '}
                  <span className="text-gray-800 font-normal normal-case text-[11.5px]">(blank = all expos)</span>
                </label>
                <div className="relative">
                  <select value={customExpoId} onChange={(e) => setCustomExpoId(e.target.value)} className={selectCls}>
                    <option value="">— General (All Expos) —</option>
                    {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              </div>

              {/* Enquiry Type — shown for sms and whatsapp only */}
              {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Enquiry Type{' '}
                    <span className="text-gray-800 font-normal normal-case text-[11.5px]">
                      {customExpoId ? '(expo-scoped)' : '(blank = all types)'}
                    </span>
                  </label>
                  <div className="relative">
                    <select value={customEnquiryId} onChange={(e) => setCustomEnquiryId(e.target.value)} className={selectCls}>
                      <option value="">— General (All Enquiry Types) —</option>
                      {scopedEnquiryTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              )}

              {/* Industry Type — shown for sms and whatsapp only */}
              {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Industry Type{' '}
                    <span className="text-gray-800 font-normal normal-case text-[11.5px]">
                      {customExpoId ? '(general + expo-specific)' : '(blank = all types)'}
                    </span>
                  </label>
                  <div className="relative">
                    <select value={customIndustryId} onChange={(e) => setCustomIndustryId(e.target.value)} className={selectCls}>
                      <option value="">— General (All Industry Types) —</option>
                      {scopedIndustryTypes.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              )}
            </div>

            {/* Entry fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
              {fields.map((f) => (
                <div key={f.name} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      placeholder={f.placeholder}
                      value={customForm[f.name] || ''}
                      onChange={(e) => setCustomForm({ ...customForm, [f.name]: e.target.value })}
                      className={`${inputCls} resize-none`}
                      rows={3}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={customForm[f.name] || ''}
                      onChange={(e) => setCustomForm({ ...customForm, [f.name]: e.target.value })}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Context badge + save button */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
              <span className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-800">Saving as:</span>
                {customExpoId
                  ? <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[11.5px] font-semibold">
                      {expos.find(e => e.id == customExpoId)?.expo_name || `Expo #${customExpoId}`}
                    </span>
                  : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11.5px] font-medium">All Expos</span>}
                {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                  customEnquiryId
                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[11.5px] font-semibold">
                        {enquiryTypes.find(e => e.id == customEnquiryId)?.name || `Enquiry #${customEnquiryId}`}
                      </span>
                    : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11.5px] font-medium">All Enquiry Types</span>
                )}
                {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                  customIndustryId
                    ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[11.5px] font-semibold">
                        {industryTypes.find(i => i.id == customIndustryId)?.name || `Industry #${customIndustryId}`}
                      </span>
                    : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11.5px] font-medium">All Industry Types</span>
                )}
              </span>
              <button
                onClick={handleAddCustom}
                disabled={addingCustom || !isCustomFormValid}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isCustomFormValid && !addingCustom
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 text-gray-800 cursor-not-allowed'
                }`}
              >
                {addingCustom ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Save Entry</>
                )}
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ══ NON-CUSTOMIZABLE TABS: plain add form ══ */
        addLabel && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">{addLabel}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((f) => (
                  <div key={f.name} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                    <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        placeholder={f.placeholder}
                        value={form[f.name] || ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        onKeyDown={handleKeyDown}
                        className={`${inputCls} resize-none`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={form[f.name] || ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        onKeyDown={handleKeyDown}
                        className={inputCls}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAdd}
                  disabled={adding || !isFormValid}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isFormValid && !adding
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-gray-100 text-gray-800 cursor-not-allowed'
                  }`}
                >
                  {adding ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Adding...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Add Entry</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ══ CUSTOM ENTRIES with filter (customizable tabs only) ══ */}
      {isCustomizable && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header + filter dropdowns */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-sm flex-1">
              {tabLabel} — Custom Entries
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {customData.length}
              </span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onRefresh}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="relative">
                <select
                  value={filterExpoId}
                  onChange={(e) => setFilterExpoId(e.target.value)}
                  className="pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">All Expos</option>
                  <option value="__general__">General only</option>
                  {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                </select>
                <ChevronDown />
              </div>
              {/* Enquiry filter — sms and whatsapp only */}
              {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                <div className="relative">
                  <select
                    value={filterEnquiryId}
                    onChange={(e) => setFilterEnquiryId(e.target.value)}
                    className="pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Enquiry Types</option>
                    <option value="__general__">General only</option>
                    {filterScopedEnquiryTypes.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              )}
              {/* Industry filter — sms and whatsapp only */}
              {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                <div className="relative">
                  <select
                    value={filterIndustryId}
                    onChange={(e) => setFilterIndustryId(e.target.value)}
                    className="pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Industry Types</option>
                    <option value="__general__">General only</option>
                    {filterScopedIndustryTypes.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <ChevronDown />
                </div>
              )}
              {(filterExpoId || filterEnquiryId || filterIndustryId) && (
                <button
                  onClick={() => { setFilterExpoId(''); setFilterEnquiryId(''); setFilterIndustryId(''); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {customLoading ? (
            <LoadingState />
          ) : shownCustom.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-800">
                {(filterExpoId || filterEnquiryId) ? 'No entries match this filter.' : 'No custom entries yet.'}
              </p>
              <p className="text-xs text-gray-800 mt-1">Add entries using the form above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {shownCustom.map((item, idx) => {
                const name = item.title || item.name || '—';
                const expoLabel = item.expo_id
                  ? (expos.find(e => e.id == item.expo_id)?.expo_name || item.expo_name || `Expo #${item.expo_id}`)
                  : null;
                const eqLabel = item.enquiry_type_id
                  ? (enquiryTypes.find(e => e.id == item.enquiry_type_id)?.name || `Enquiry #${item.enquiry_type_id}`)
                  : null;
                const isEditingThis = editingCustomItem?.id === item.id;

                return (
                  <div key={item.id} className={`transition-colors group ${isEditingThis ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}>
                    {isEditingThis ? (
                      /* ── Inline edit form for custom entry ── */
                      <div className="px-6 py-4 space-y-3">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Editing entry</p>
                        {fields.map((f) => (
                          <div key={f.name}>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">{f.label}</label>
                            {f.type === 'textarea' ? (
                              <textarea
                                value={editCustomForm[f.name] || ''}
                                onChange={(e) => setEditCustomForm({ ...editCustomForm, [f.name]: e.target.value })}
                                className={`${inputCls} resize-none`}
                                rows={3}
                              />
                            ) : (
                              <input type="text" value={editCustomForm[f.name] || ''} onChange={(e) => setEditCustomForm({ ...editCustomForm, [f.name]: e.target.value })} className={inputCls} />
                            )}
                          </div>
                        ))}
                        {/* Expo selector in edit mode */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Expo</label>
                          <div className="relative">
                            <select value={editCustomForm.expo_id || ''} onChange={(e) => setEditCustomForm({ ...editCustomForm, expo_id: e.target.value || null })} className={`${selectCls}`}>
                              <option value="">— General (All Expos) —</option>
                              {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleSaveCustomEdit}
                            disabled={savingCustomEdit || fields.some(f => !editCustomForm[f.name]?.trim())}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {savingCustomEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button onClick={() => { setEditingCustomItem(null); setEditCustomForm({}); }} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal row view ── */
                      <div className="flex items-start justify-between px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-gray-800 w-5 mt-0.5 flex-shrink-0">{idx + 1}.</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{name}</p>
                            {item.subject && <p className="text-xs text-gray-500 mt-0.5">Subject: {item.subject}</p>}
                            {item.content && <p className="text-xs text-gray-800 mt-0.5 line-clamp-2">{item.content}</p>}
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {expoLabel
                                ? <span className="text-[11.5px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{expoLabel}</span>
                                : <span className="text-[11.5px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">General</span>}
                              {(activeTab === 'sms' || activeTab === 'whatsapp') && (
                                eqLabel
                                  ? <span className="text-[11.5px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{eqLabel}</span>
                                  : <span className="text-[11.5px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">All Enquiry Types</span>
                              )}
                              {(activeTab === 'sms' || activeTab === 'whatsapp') && (() => {
                                const indLabel = item.industry_type_id
                                  ? (industryTypes.find(i => i.id == item.industry_type_id)?.name || `Industry #${item.industry_type_id}`)
                                  : null;
                                return indLabel
                                  ? <span className="text-[11.5px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{indLabel}</span>
                                  : <span className="text-[11.5px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">All Industry Types</span>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {/* Edit button */}
                          <button
                            onClick={() => {
                              const initForm = { expo_id: item.expo_id || '' };
                              fields.forEach(f => { initForm[f.name] = item[f.name] || ''; });
                              setEditingCustomItem(item);
                              setEditCustomForm(initForm);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => {
                              setDeletingCustomId(item.id);
                              onDeleteCustom(item.id).finally(() => setDeletingCustomId(null));
                            }}
                            disabled={deletingCustomId === item.id}
                            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-800 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ GENERAL LIST — only shown for non-customizable tabs ══ */}
      {!isCustomizable && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">{tabLabel}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-medium">{data.length}</span>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState label={tabLabel} />
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item, index) => {
              const displayName = item.expo_name || item.title || item.name || '—';
              const isSelected = isExpoTab && currentExpo?.id === item.id;
              const isEditing = editingItem?.id === item.id;

              return (
                <div key={item.id} className={`transition-colors group ${isEditing ? 'bg-amber-50/40' : isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}>
                  {/* ── Inline edit form ── */}
                  {isEditing ? (
                    <div className="px-6 py-4 space-y-3">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Editing #{index + 1}</p>
                      {fields.map((f) => (
                        <div key={f.name}>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">{f.label}</label>
                          {f.type === 'textarea' ? (
                            <textarea
                              value={editForm[f.name] || ''}
                              onChange={(e) => setEditForm({ ...editForm, [f.name]: e.target.value })}
                              className={`${inputCls} resize-none`}
                              rows={3}
                            />
                          ) : (
                            <input type="text" value={editForm[f.name] || ''} onChange={(e) => setEditForm({ ...editForm, [f.name]: e.target.value })} className={inputCls} />
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={savingEdit || fields.some(f => !editForm[f.name]?.trim())}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={() => { setEditingItem(null); setEditForm({}); }} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-4 flex items-start">
                      <div className="w-6 flex-shrink-0 mr-3 mt-0.5">
                        <span className="text-xs font-semibold text-gray-800">{index + 1}.</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{displayName}</p>
                        {item.subject && <p className="text-xs text-gray-500 mt-0.5">Subject: {item.subject}</p>}
                        {item.content && <p className="text-xs text-gray-800 mt-0.5 line-clamp-2">{item.content}</p>}
                        {item.status && <p className="text-xs text-gray-500 mt-0.5 capitalize">Status: {item.status}</p>}
                        <p className="text-xs text-gray-800 mt-1">Added {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                        {isExpoTab && !isSelected && (
                          <button onClick={async () => { setSettingId(item.id); try { await onSetCurrentExpo(item.id); cacheSelectedExpo({ id: item.id, expo_name: item.expo_name }); setCurrentExpo({ id: item.id, expo_name: item.expo_name }); } finally { setSettingId(null); } }} disabled={settingId === item.id} className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all font-medium whitespace-nowrap disabled:opacity-50">
                            {settingId === item.id ? '...' : 'Set Current'}
                          </button>
                        )}
                        {isExpoTab && isSelected && (
                          <button onClick={async () => { setSettingId(item.id); try { await onSetCurrentExpo(null); cacheSelectedExpo(null); setCurrentExpo(null); } finally { setSettingId(null); } }} disabled={settingId === item.id} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all font-medium whitespace-nowrap disabled:opacity-50">
                            {settingId === item.id ? '...' : 'Clear'}
                          </button>
                        )}
                        {/* Edit button — only for tabs with update support */}
                        {onUpdate && !isExpoTab && (
                          <button
                            onClick={() => {
                              const initForm = {};
                              fields.forEach(f => { initForm[f.name] = item[f.name] || ''; });
                              setEditingItem(item);
                              setEditForm(initForm);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {isDeletable && (
                          showConfirm === item.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setShowConfirm(null)} className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-200 transition">Cancel</button>
                              <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                                {deletingId === item.id ? 'Deleting...' : 'Confirm'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowConfirm(item.id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-800 hover:text-red-600 hover:bg-red-50 transition-all">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MasterPage() {
  const [activeTab, setActiveTab] = useState('sources');
  const [data, setData] = useState({
    sources: [], expos: [], enquiry: [], industry: [], sms: [], whatsapp: [],
  });
  const [customData, setCustomData] = useState({
    enquiry: [], industry: [], sms: [], whatsapp: [],
  });
  const [customLoading, setCustomLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expos, setExpos] = useState([]);
  const [enquiryTypes, setEnquiryTypes] = useState([]);
  const [industryTypes, setIndustryTypes] = useState([]);
  const { addToast } = useToast();

  // Load expos and enquiry types for context selectors on mount
  // Note: industryTypes are no longer loaded here — SMS/WhatsApp tabs fetch them
  // dynamically from the context API when an expo is selected
  useEffect(() => {
    Promise.all([masterApi.getExpos(), masterApi.getEnquiryTypes()])
      .then(([e, eq]) => {
        setExpos(e.data.data || []);
        setEnquiryTypes(eq.data.data || []);
      })
      .catch(() => {});
  }, []);

  // Sync current expo from DB to localStorage cache on mount
  useEffect(() => {
    masterApi.getCurrentExpo()
      .then((res) => { cacheSelectedExpo(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  // Load custom data when switching to a customizable tab
  useEffect(() => {
    if (['enquiry', 'industry', 'sms', 'whatsapp'].includes(activeTab)) {
      loadCustomData(activeTab);
    }
  }, [activeTab]);

  const loadCustomData = async (tab) => {
    setCustomLoading(true);
    try {
      let res;
      switch (tab) {
        case 'enquiry':  res = await masterApi.getEnquiryTypes();                break;
        case 'industry': res = await masterApi.getIndustryTypes();               break;
        case 'sms':      res = await masterApi.getSmsTemplatesForContext();      break;
        case 'whatsapp': res = await masterApi.getWhatsappTemplatesForContext(); break;
        default: return;
      }
      const resData = res.data.data;
      let custom = [];
      if (tab === 'enquiry' || tab === 'industry') {
        // getEnquiryTypes / getIndustryTypes return flat array — all rows are entries with expo_id
        custom = Array.isArray(resData) ? resData : [];
      } else if (Array.isArray(resData)) {
        custom = resData.filter(d => d.type === 'custom');
      } else if (resData && typeof resData === 'object') {
        custom = resData.custom || [];
      }
      setCustomData(prev => ({ ...prev, [tab]: custom }));
    } catch {
      // ignore — custom panel just shows empty
    } finally {
      setCustomLoading(false);
    }
  };

  const handleSetCurrentExpo = async (id) => {
    try {
      await masterApi.setCurrentExpo(id);
      addToast(id ? 'Current expo updated for all users' : 'Current expo cleared', 'success');
    } catch {
      addToast('Failed to update current expo', 'error');
      throw new Error('failed');
    }
  };

  const handleRefresh = async () => {
    await loadTab(activeTab);
    if (['enquiry', 'industry', 'sms', 'whatsapp'].includes(activeTab)) {
      await loadCustomData(activeTab);
    }
  };

  const loadTab = async (tab) => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'sources':   res = await masterApi.getSources();          break;
        case 'expos':     res = await masterApi.getExpos();            break;
        case 'enquiry':   res = await masterApi.getEnquiryTypes();     break;
        case 'industry':  res = await masterApi.getIndustryTypes();    break;
        case 'sms':       res = await masterApi.getSmsTemplates();     break;
        case 'whatsapp':  res = await masterApi.getWhatsappTemplates(); break;
        default: return;
      }
      setData((prev) => ({ ...prev, [tab]: res.data.data }));
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (tab, form) => {
    try {
      switch (tab) {
        case 'expos':     await masterApi.createExpo(form);            break;
        case 'enquiry':   await masterApi.createEnquiryType(form);     break;
        case 'industry':  await masterApi.createIndustryType(form);    break;
        case 'sms':       await masterApi.createSmsTemplate(form);     break;
        case 'whatsapp':  await masterApi.createWhatsappTemplate(form); break;
      }
      addToast('Added successfully', 'success');
      loadTab(tab);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add', 'error');
    }
  };

  const handleUpdate = async (tab, id, form) => {
    try {
      switch (tab) {
        case 'expos':     await masterApi.updateExpo(id, form);            break;
        case 'enquiry':   await masterApi.updateEnquiryType(id, form);     break;
        case 'industry':  await masterApi.updateIndustryType(id, form);    break;
        case 'sms':       await masterApi.updateSmsTemplate(id, form);     break;
        case 'whatsapp':  await masterApi.updateWhatsappTemplate(id, form); break;
      }
      addToast('Updated successfully', 'success');
      loadTab(tab);
      if (['enquiry', 'industry'].includes(tab)) loadCustomData(tab);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    }
  };

  const handleUpdateCustom = async (tab, id, form) => {
    try {
      switch (tab) {
        case 'sms':      await masterApi.updateCustomSmsTemplate(id, form);      break;
        case 'whatsapp': await masterApi.updateCustomWhatsappTemplate(id, form); break;
        case 'enquiry':  await masterApi.updateEnquiryType(id, form);            break;
        case 'industry': await masterApi.updateIndustryType(id, form);           break;
      }
      addToast('Updated successfully', 'success');
      loadCustomData(tab);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    }
  };

  const handleDelete = async (tab, id) => {
    try {
      switch (tab) {
        case 'expos':     await masterApi.deleteExpo(id);            break;
        case 'enquiry':   await masterApi.deleteEnquiryType(id);     break;
        case 'industry':  await masterApi.deleteIndustryType(id);    break;
        case 'sms':       await masterApi.deleteSmsTemplate(id);     break;
        case 'whatsapp':  await masterApi.deleteWhatsappTemplate(id); break;
      }
      addToast('Deleted successfully', 'success');
      loadTab(tab);
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleAddCustom = async (tab, form) => {
    try {
      switch (tab) {
        case 'enquiry':  await masterApi.createEnquiryType(form);             break;
        case 'industry': await masterApi.createIndustryType(form);            break;
        case 'sms':      await masterApi.createCustomSmsTemplate(form);       break;
        case 'whatsapp': await masterApi.createCustomWhatsappTemplate(form);  break;
      }
      addToast('Entry saved successfully', 'success');
      loadCustomData(tab);
      loadTab(tab);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save entry', 'error');
    }
  };

  const handleDeleteCustom = async (tab, id) => {
    try {
      switch (tab) {
        case 'enquiry':  await masterApi.deleteEnquiryType(id);              break;
        case 'industry': await masterApi.deleteIndustryType(id);             break;
        case 'sms':      await masterApi.deleteCustomSmsTemplate(id);        break;
        case 'whatsapp': await masterApi.deleteCustomWhatsappTemplate(id);   break;
      }
      addToast('Custom entry deleted', 'success');
      loadCustomData(tab);
      loadTab(tab);
    } catch {
      addToast('Failed to delete custom entry', 'error');
    }
  };

  const tabConfig = {
    sources: { addLabel: null, fields: [], isDeletable: false },
    expos: {
      addLabel: 'Add New Expo',
      fields: [{ name: 'expo_name', placeholder: 'Enter expo name...', label: 'Expo Name' }],
      isDeletable: true,
    },
    enquiry: {
      addLabel: 'Add Enquiry Type',
      fields: [{ name: 'name', placeholder: 'Enter enquiry type name...', label: 'Name' }],
      isDeletable: true,
      isCustomizable: true,
    },
    industry: {
      addLabel: 'Add Industry Type',
      fields: [{ name: 'name', placeholder: 'Enter industry type name...', label: 'Name' }],
      isDeletable: true,
      isCustomizable: true,
    },
    sms: {
      addLabel: 'Add SMS Template',
      fields: [
        { name: 'title',   placeholder: 'Enter template title...', label: 'Title' },
        { name: 'content', placeholder: 'Enter SMS content...', label: 'Content', type: 'textarea' },
      ],
      isDeletable: true,
      isCustomizable: true,
    },
    whatsapp: {
      addLabel: 'Add WhatsApp Template',
      fields: [
        { name: 'title',   placeholder: 'Enter template title...', label: 'Title' },
        { name: 'content', placeholder: 'Enter WhatsApp message content...', label: 'Content', type: 'textarea' },
      ],
      isDeletable: true,
      isCustomizable: true,
    },
  };

  const activeTabInfo = TABS.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight">Master Data</h1>
              <p className="text-gray-900 text-sm">Manage lookup data used across the application</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1.5 mb-6">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Description */}
        {activeTabInfo && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <span className="text-blue-600 scale-[1.25]">{activeTabInfo.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-black">{activeTabInfo.label}</h2>
              <p className="text-xs text-gray-900">{activeTabInfo.description}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'sources' ? (
          <SourcesTab data={data[activeTab]} loading={loading} onRefresh={handleRefresh} />
        ) : activeTab === 'expos' ? (
          <ExpoTab
            key="expos"
            data={data.expos}
            loading={loading}
            onAdd={(form) => handleAdd('expos', form)}
            onUpdate={(id, form) => handleUpdate('expos', id, form)}
            onDelete={(id) => handleDelete('expos', id)}
            onSetCurrentExpo={handleSetCurrentExpo}
            onRefresh={handleRefresh}
          />
        ) : (
          <SimpleListTab
            key={activeTab}
            data={data[activeTab]}
            loading={loading}
            onAdd={(form) => handleAdd(activeTab, form)}
            onUpdate={(id, form) => handleUpdate(activeTab, id, form)}
            onDelete={(id) => handleDelete(activeTab, id)}
            fields={tabConfig[activeTab].fields}
            addLabel={tabConfig[activeTab].addLabel}
            tabLabel={activeTabInfo?.label}
            isDeletable={tabConfig[activeTab].isDeletable}
            isExpoTab={activeTab === 'expos'}
            onSetCurrentExpo={handleSetCurrentExpo}
            isCustomizable={tabConfig[activeTab].isCustomizable || false}
            expos={expos}
            enquiryTypes={enquiryTypes}
            industryTypes={industryTypes}
            activeTab={activeTab}
            onAddCustom={(form) => handleAddCustom(activeTab, form)}
            onUpdateCustom={(id, form) => handleUpdateCustom(activeTab, id, form)}
            customData={customData[activeTab] || []}
            customLoading={customLoading}
            onDeleteCustom={(id) => handleDeleteCustom(activeTab, id)}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}