import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { customerApi, masterApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// ─── Selected Expo (localStorage cache; DB is source of truth) ─────────────────
const SELECTED_EXPO_KEY = 'selectedExpo';
function getSelectedExpo() {
  try { return JSON.parse(localStorage.getItem(SELECTED_EXPO_KEY)) || null; } catch { return null; }
}
function cacheSelectedExpo(expo) {
  if (expo) localStorage.setItem(SELECTED_EXPO_KEY, JSON.stringify(expo));
  else localStorage.removeItem(SELECTED_EXPO_KEY);
}

const PAGE_SIZE = 10;

function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">{children}</div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) { start = 2; end = maxVisible; }
      if (currentPage >= totalPages - 2) { start = totalPages - maxVisible + 1; end = totalPages - 1; }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-100">
      <p className="text-sm text-black/60">
        Showing <span className="font-semibold text-black">{(currentPage - 1) * PAGE_SIZE + 1}</span>
        {' '}-{' '}
        <span className="font-semibold text-black">{Math.min(currentPage * PAGE_SIZE, totalItems)}</span>
        {' '}of{' '}
        <span className="font-semibold text-black">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-black/20 text-black/60 hover:bg-black/5 hover:border-black/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-black text-sm">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-black/70 hover:bg-black/10 border border-transparent hover:border-black/20'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-black/20 text-black/60 hover:bg-black/5 hover:border-black/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SelectChevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value || '—'}
        readOnly
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 cursor-default focus:outline-none"
      />
    </div>
  );
}

function getInputClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300'
  }`;
}

// ─── ExpoDropdown — 2 options only: current expo + Others ────────────────────
function ExpoDropdown({ value, onChange, sources, onAddSource, currentExpo }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value && currentExpo && String(value) !== String(currentExpo.id)) {
      setShowCustomInput(true);
      setCustomInput(value);
    } else if (value && !currentExpo) {
      setShowCustomInput(true);
      setCustomInput(value);
    }
  }, [value, currentExpo]);

  const handleCustomInputChange = (e) => {
    const input = e.target.value;
    setCustomInput(input);
    onChange(input);
    if (input.trim()) {
      const matches = sources.filter(s => s.source_name.toLowerCase().includes(input.toLowerCase()));
      setFilteredSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (sourceName) => {
    setCustomInput(sourceName);
    onChange(sourceName);
    setShowSuggestions(false);
    if (!sources.some(s => s.source_name === sourceName)) {
      await onAddSource(sourceName);
    }
  };

  const handleAddCustomSource = async () => {
    if (customInput.trim()) {
      await onAddSource(customInput.trim());
      setShowSuggestions(false);
    }
  };

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
          className={getInputClasses(false)}
        />
        {showSuggestions && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {filteredSuggestions.length > 0 ? (
              <>
                {filteredSuggestions.map((source) => (
                  <button key={source.id} type="button"
                    onClick={() => handleSuggestionClick(source.source_name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-900 cursor-pointer"
                  >
                    {source.source_name}
                  </button>
                ))}
                <button type="button" onClick={handleAddCustomSource}
                  className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 cursor-pointer"
                >
                  + Add "{customInput}" as new source
                </button>
              </>
            ) : (
              <button type="button" onClick={handleAddCustomSource}
                className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 cursor-pointer"
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
            if (currentExpo) onChange(String(currentExpo.id));
            else onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >✕</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentExpo ? String(currentExpo.id) : ''}
        onChange={(e) => {
          if (e.target.value === 'others') {
            setShowCustomInput(true);
            setCustomInput('');
            onChange('');
          } else if (currentExpo) {
            onChange(String(currentExpo.id));
          }
        }}
        className={`${getInputClasses(false)} cursor-pointer`}
      >
        {currentExpo ? (
          <option value={String(currentExpo.id)}>{currentExpo.expo_name}</option>
        ) : (
          <option value="">No current expo — choose Others</option>
        )}
        <option value="others">—— Others (Custom Source) ——</option>
      </select>
    </div>
  );
}

// ─── Additional Contacts Component ───────────────────────────────────────────
const EMPTY_CONTACT = { name: '', designation: '', phone: '', phone_2: '', email: '' };

function AdditionalContacts({ contacts, onChange }) {
  const [draft, setDraft] = useState(EMPTY_CONTACT);
  const [draftErrors, setDraftErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);

  const validateDraft = () => {
    const errs = {};
    if (!draft.name.trim()) errs.name = 'Name required';
    if (!draft.phone.trim()) errs.phone = 'Phone required';
    return errs;
  };

  const handleAdd = () => {
    const errs = validateDraft();
    if (Object.keys(errs).length) { setDraftErrors(errs); return; }
    onChange([...contacts, { ...draft, id: Date.now() }]);
    setDraft(EMPTY_CONTACT);
    setDraftErrors({});
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    setDraft({ ...contacts[idx] });
    setDraftErrors({});
  };

  const handleUpdate = () => {
    const errs = validateDraft();
    if (Object.keys(errs).length) { setDraftErrors(errs); return; }
    const updated = contacts.map((c, i) => (i === editingIndex ? { ...c, ...draft } : c));
    onChange(updated);
    setEditingIndex(null);
    setDraft(EMPTY_CONTACT);
    setDraftErrors({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setDraft(EMPTY_CONTACT);
    setDraftErrors({});
  };

  const handleRemove = (idx) => {
    onChange(contacts.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">Additional Contacts</span>
          {contacts.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">{contacts.length}</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((c, idx) => (
              <div
                key={c.id || idx}
                className={`flex items-start gap-3 p-3 bg-gray-50 rounded-xl border ${editingIndex === idx ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'} transition-all`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}
                    {c.designation && <span className="text-sm text-gray-500 ml-2 font-normal">• {c.designation}</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {c.phone}
                    </span>
                    {c.phone_2 && <span className="text-sm text-gray-500">{c.phone_2}</span>}
                    {c.email && <span className="text-sm text-blue-600">{c.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-white space-y-4">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {editingIndex !== null ? '✏️ Edit Contact' : '➕ Add New Contact'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contact name"
                value={draft.name}
                onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setDraftErrors({ ...draftErrors, name: '' }); }}
                className={getInputClasses(!!draftErrors.name)}
              />
              {draftErrors.name && <p className="text-sm text-red-500 mt-1">{draftErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
              <input
                type="text"
                placeholder="e.g. Manager"
                value={draft.designation}
                onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
                className={getInputClasses(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Primary phone"
                value={draft.phone}
                onChange={(e) => { setDraft({ ...draft, phone: e.target.value }); setDraftErrors({ ...draftErrors, phone: '' }); }}
                className={getInputClasses(!!draftErrors.phone)}
              />
              {draftErrors.phone && <p className="text-sm text-red-500 mt-1">{draftErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone 2</label>
              <input
                type="tel"
                placeholder="Secondary phone"
                value={draft.phone_2}
                onChange={(e) => setDraft({ ...draft, phone_2: e.target.value })}
                className={getInputClasses(false)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className={getInputClasses(false)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {editingIndex !== null ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-all cursor-pointer"
                >
                  Update Contact
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View Additional Contacts Component (Read-only) ───────────────────────────
function ViewAdditionalContacts({ contacts }) {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">Additional Contacts</span>
          <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">{contacts.length}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {contacts.map((c, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ReadOnlyField label="Name" value={c.name} />
              <ReadOnlyField label="Designation" value={c.designation} />
              <ReadOnlyField label="Phone" value={c.phone} />
              <ReadOnlyField label="Phone 2" value={c.phone_2} />
              <div className="sm:col-span-2">
                <ReadOnlyField label="Email" value={c.email} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Reports() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filters, setFilters] = useState({ expo_id: '', industry_type: '', enquiry_type: '' });
  const [expos, setExpos] = useState([]);
  const [sources, setSources] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [editEnquiries, setEditEnquiries] = useState([]);
  const [editIndustries, setEditIndustries] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [searchField, setSearchField] = useState('');
  const [currentExpo, setCurrentExpo] = useState(() => getSelectedExpo());
  const isOnline = useNetworkStatus();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [searchField]);

  const loadData = useCallback(async () => {
    if (!isOnline) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await customerApi.getAll();
      setAllCustomers(res.data.data || []);
    } catch {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [isOnline, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCustomers = useMemo(() => {
    const term = (searchDebounced || '').trim().toLowerCase();
    const fieldMap = {
      customer_name: 'customer_name',
      company_name: 'company_name',
      designation: 'designation',
      phone_number: 'phone_number',
      email: 'email',
      city: 'city',
      location: 'location',
      website: 'website',
    };

    return allCustomers.filter((c) => {
      if (filters.expo_id && String(c.expo_id) !== String(filters.expo_id)) return false;
      if (filters.industry_type && String(c.industry_type) !== String(filters.industry_type)) return false;
      if (filters.enquiry_type && String(c.enquiry_type) !== String(filters.enquiry_type)) return false;

      if (!term) return true;
      const value = (fieldMap[searchField] ? c[fieldMap[searchField]] :
        `${c.customer_name || ''} ${c.company_name || ''} ${c.designation || ''} ${c.phone_number || ''} ${c.email || ''} ${c.city || ''} ${c.location || ''} ${c.website || ''}`
      ).toString().toLowerCase();
      return value.includes(term);
    });
  }, [allCustomers, searchDebounced, searchField, filters]);

  useEffect(() => {
    if (!isOnline) return;
    Promise.all([
      masterApi.getExpos(),
      masterApi.getSources(),
      masterApi.getEnquiryTypes(),
      masterApi.getIndustryTypes(),
      masterApi.getCurrentExpo(),
    ])
      .then(([e, src, eq, i, ce]) => {
        setExpos(e.data.data);
        setSources(src.data.data || []);
        const generalEnquiries = (eq.data.data || []).filter(x => !x.expo_id).map(x => x.name);
        const generalIndustries = (i.data.data || []).filter(x => !x.expo_id).map(x => x.name);
        setEnquiries(generalEnquiries);
        setIndustries(generalIndustries);
        setEditEnquiries(generalEnquiries);
        setEditIndustries(generalIndustries);
        const dbExpo = ce.data.data || null;
        cacheSelectedExpo(dbExpo);
        setCurrentExpo(dbExpo);
        setFilters((prev) => ({
          ...prev,
          expo_id: prev.expo_id || (dbExpo ? String(dbExpo.id) : ''),
        }));
      })
      .catch(() => {});
  }, [isOnline]);

  useEffect(() => {
    if (!editRecord || !isOnline) return;
    const expoId = editRecord.expo_id && !isNaN(Number(editRecord.expo_id)) ? String(editRecord.expo_id) : null;
    if (!expoId) {
      setEditEnquiries(enquiries);
      setEditIndustries(industries);
      return;
    }
    masterApi.getSmsTemplatesForContext(expoId)
      .then((res) => {
        const d = res.data.data;
        if (d && d.enquiryTypes) setEditEnquiries(d.enquiryTypes.map(x => x.name));
        if (d && d.industryTypes) setEditIndustries(d.industryTypes.map(x => x.name));
      })
      .catch(() => {
        setEditEnquiries(enquiries);
        setEditIndustries(industries);
      });
  }, [editRecord?.expo_id, isOnline]);

  const handleAddSource = async (sourceName) => {
    try {
      const res = await masterApi.addSource({ source_name: sourceName });
      setSources([...sources, res.data.data]);
      return res.data.data;
    } catch (err) {
      console.error('Failed to add source:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerApi.delete(deleteId);
      addToast('Customer deleted successfully', 'success');
      setDeleteId(null);
      loadData();
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await customerApi.update(editRecord.id, editRecord);
      addToast('Customer updated successfully', 'success');
      setEditRecord(null);
      loadData();
    } catch {
      addToast('Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchField('');
    setFilters({ expo_id: '', industry_type: '', enquiry_type: '' });
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656M12 12h.01" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-black mb-2">No Internet Connection</h2>
          <p className="text-sm text-black/60">Reports require an active internet connection. Please connect to the network to view customer records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight">Reports</h1>
              <p className="text-black/60 text-sm">
                {loading ? 'Loading...' : `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-black/10 text-black hover:bg-black/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-black/10 bg-white text-sm font-medium text-black hover:bg-black/5 transition-all duration-200 cursor-pointer"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Search & Filters Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-shrink-0 w-44">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-black/20 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="">All Fields</option>
                  <option value="customer_name">Customer Name</option>
                  <option value="company_name">Company Name</option>
                  <option value="designation">Designation</option>
                  <option value="phone_number">Phone Number</option>
                  <option value="email">Email</option>
                  <option value="city">City</option>
                  <option value="location">Location</option>
                  <option value="website">Website</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className="w-4 h-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="w-4 h-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={searchField ? `Search by ${searchField.replace(/_/g, ' ')}...` : 'Search all fields...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 rounded-lg border border-black/20 bg-white text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-black/40 hover:text-black/60 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 border-t border-black/10 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm uppercase tracking-wider text-black font-semibold mb-1.5">Expo</label>
                <div className="relative">
                  <select value={filters.expo_id} onChange={(e) => handleFilterChange('expo_id', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-black/20 appearance-none cursor-pointer transition-all duration-200">
                    <option value="">All Expos</option>
                    {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider text-black font-semibold mb-1.5">Industry</label>
                <div className="relative">
                  <select value={filters.industry_type} onChange={(e) => handleFilterChange('industry_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-black/20 appearance-none cursor-pointer transition-all duration-200">
                    <option value="">All Industries</option>
                    {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider text-black font-semibold mb-1.5">Enquiry Type</label>
                <div className="relative">
                  <select value={filters.enquiry_type} onChange={(e) => handleFilterChange('enquiry_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-black/20 appearance-none cursor-pointer transition-all duration-200">
                    <option value="">All Enquiries</option>
                    {enquiries.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-3 flex justify-end">
                <button onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-black/10 border-t-blue-600 animate-spin mx-auto mb-4"></div>
              <p className="text-black/60">Loading customers...</p>
            </div>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <svg className="w-12 h-12 text-black/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3.645A2.645 2.645 0 013 18.355V5.645A2.645 2.645 0 015.645 3h12.71A2.645 2.645 0 0121 5.645v12.71A2.645 2.645 0 0118.355 21" />
            </svg>
            <p className="text-black/60">No customers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-white border-b border-black/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">S. No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Contact Person</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Designation</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Contact Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Expo / Source</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Enquiry Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black uppercase tracking-wider border border-black/10">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedCustomers.map((customer, idx) => {
                    const serial = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={customer.id} className="hover:bg-black/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{serial}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{customer.company_name}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{customer.customer_name}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{customer.designation || '—'}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">
                          <div className="space-y-1">
                            <p>{customer.phone_number || '—'}</p>
                            {customer.mobile_no_2 && <p className="text-black/60">{customer.mobile_no_2}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">
                          {customer.email ? <span className="text-blue-600 truncate block max-w-[180px]">{customer.email}</span> : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{customer.expo_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">{customer.enquiry_type || '—'}</td>
                        <td className="px-6 py-4 text-sm text-black border border-black/10">
                          <div className="flex items-center gap-1">
                            {/* View Button */}
                            <button
                              onClick={() => setViewRecord(customer)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {/* Edit Button */}
                            <button
                              onClick={() => setEditRecord(customer)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 cursor-pointer"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteId(customer.id)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCustomers.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            VIEW MODAL - Using Input Fields
        ═══════════════════════════════════════════════════════════════════════════ */}
        {viewRecord && (
          <Modal title="Customer Details" size="lg" onClose={() => setViewRecord(null)}>
            <div className="space-y-6">
              {/* Expo / Source Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Expo / Source</span>
                </div>
                <input
                  type="text"
                  value={viewRecord.expo_name || '—'}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm text-gray-900 cursor-default focus:outline-none"
                />
              </div>

              {/* Personal Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Customer Name" value={viewRecord.customer_name} />
                  <ReadOnlyField label="Company Name" value={viewRecord.company_name} />
                  <div className="sm:col-span-2">
                    <ReadOnlyField label="Designation" value={viewRecord.designation} />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Phone Number 1" value={viewRecord.phone_number} />
                  <ReadOnlyField label="Phone Number 2" value={viewRecord.mobile_no_2} />
                  <ReadOnlyField label="Email 1" value={viewRecord.email} />
                  <ReadOnlyField label="Email 2" value={viewRecord.email_2} />
                  <div className="sm:col-span-2">
                    <ReadOnlyField label="Website" value={viewRecord.website} />
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Business Details
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Enquiry Type" value={viewRecord.enquiry_type} />
                  <ReadOnlyField label="Industry Type" value={viewRecord.industry_type} />
                  <ReadOnlyField label="City" value={viewRecord.city} />
                  <ReadOnlyField label="Location" value={viewRecord.location} />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                    <textarea
                      value={viewRecord.remarks || '—'}
                      readOnly
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 cursor-default focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Contacts */}
              <ViewAdditionalContacts contacts={viewRecord.additional_contacts} />
            </div>
          </Modal>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            EDIT MODAL - Professional Design
        ═══════════════════════════════════════════════════════════════════════════ */}
        {editRecord && (
          <Modal title="Edit Customer" size="xl" onClose={() => setEditRecord(null)}>
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Expo / Source Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Expo Name / Source</label>
                    <p className="text-sm text-gray-500">Select the event or source of this customer</p>
                  </div>
                </div>
                <ExpoDropdown
                  value={editRecord.expo_id || editRecord.expo_name || ''}
                  onChange={(val) => setEditRecord({
                    ...editRecord,
                    expo_id: !isNaN(val) && val !== '' ? val : null,
                    expo_name: isNaN(val) || val === '' ? val : editRecord.expo_name,
                  })}
                  sources={sources}
                  onAddSource={handleAddSource}
                  currentExpo={currentExpo}
                />
              </div>

              {/* Personal Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={editRecord.customer_name}
                      onChange={(e) => setEditRecord({...editRecord, customer_name: e.target.value})}
                      className={getInputClasses(false)} placeholder="Enter customer name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={editRecord.company_name}
                      onChange={(e) => setEditRecord({...editRecord, company_name: e.target.value})}
                      className={getInputClasses(false)} placeholder="Enter company name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
                    <input type="text" value={editRecord.designation || ''}
                      onChange={(e) => setEditRecord({...editRecord, designation: e.target.value})}
                      className={getInputClasses(false)} placeholder="e.g. Manager, Director, CEO" />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Information
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number 1 <span className="text-red-500">*</span></label>
                    <input type="text" required value={editRecord.phone_number}
                      onChange={(e) => setEditRecord({...editRecord, phone_number: e.target.value})}
                      className={getInputClasses(false)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number 2</label>
                    <input type="text" value={editRecord.mobile_no_2 || ''}
                      onChange={(e) => setEditRecord({...editRecord, mobile_no_2: e.target.value})}
                      className={getInputClasses(false)} placeholder="Alternate phone number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email 1</label>
                    <input type="email" value={editRecord.email || ''}
                      onChange={(e) => setEditRecord({...editRecord, email: e.target.value})}
                      className={getInputClasses(false)} placeholder="primary@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email 2</label>
                    <input type="email" value={editRecord.email_2 || ''}
                      onChange={(e) => setEditRecord({...editRecord, email_2: e.target.value})}
                      className={getInputClasses(false)} placeholder="secondary@email.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                    <input type="text" value={editRecord.website || ''}
                      onChange={(e) => setEditRecord({...editRecord, website: e.target.value})}
                      className={getInputClasses(false)} placeholder="https://www.example.com" />
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Business Details
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enquiry Type</label>
                    <div className="relative">
                      <select value={editRecord.enquiry_type || ''}
                        onChange={(e) => setEditRecord({...editRecord, enquiry_type: e.target.value})}
                        className={`${getInputClasses(false)} appearance-none cursor-pointer`}>
                        <option value="">Select enquiry type</option>
                        {editEnquiries.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry Type</label>
                    <div className="relative">
                      <select value={editRecord.industry_type || ''}
                        onChange={(e) => setEditRecord({...editRecord, industry_type: e.target.value})}
                        className={`${getInputClasses(false)} appearance-none cursor-pointer`}>
                        <option value="">Select industry type</option>
                        {editIndustries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input type="text" value={editRecord.city || ''}
                      onChange={(e) => setEditRecord({...editRecord, city: e.target.value})}
                      className={getInputClasses(false)} placeholder="Enter city" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <input type="text" value={editRecord.location || ''}
                      onChange={(e) => setEditRecord({...editRecord, location: e.target.value})}
                      className={getInputClasses(false)} placeholder="Enter location" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                    <textarea value={editRecord.remarks || ''}
                      onChange={(e) => setEditRecord({...editRecord, remarks: e.target.value})}
                      className={getInputClasses(false)} rows="3" placeholder="Add any additional notes or remarks..." />
                  </div>
                </div>
              </div>

              {/* Additional Contacts */}
              <AdditionalContacts
                contacts={editRecord.additional_contacts || []}
                onChange={(contacts) => setEditRecord({...editRecord, additional_contacts: contacts})}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setEditRecord(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={updating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-medium disabled:opacity-50 shadow-sm transition-all text-sm cursor-pointer">
                  {updating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            DELETE CONFIRMATION MODAL
        ═══════════════════════════════════════════════════════════════════════════ */}
        {deleteId && (
          <Modal title="Confirm Delete" size="sm" onClose={() => setDeleteId(null)}>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer Record?</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                This action cannot be undone. All data associated with this customer will be permanently removed from the system.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all text-sm min-w-[100px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 transition-all text-sm min-w-[100px] cursor-pointer"
                >
                  {deleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}