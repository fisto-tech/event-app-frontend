import React, { useState, useEffect, useCallback } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden ${
          size === 'lg' ? 'max-w-4xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">{children}</div>
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
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>
        {' '}-{' '}
        <span className="font-semibold text-gray-700">{Math.min(currentPage * PAGE_SIZE, totalItems)}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-700">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-800 text-sm">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
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
      <svg className="w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="py-2.5 px-1">
      <p className="text-[10px] uppercase tracking-wider text-gray-800 font-semibold mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function getInputClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'
  }`;
}

// ─── ExpoDropdown — 2 options only: current expo + Others ────────────────────
function ExpoDropdown({ value, onChange, sources, onAddSource, currentExpo }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // If saved value is not the current expo id → it must be a custom source
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
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
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
            if (currentExpo) onChange(String(currentExpo.id));
            else onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
        className={getInputClasses(false)}
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

  const handleRemove = (idx) => {
    onChange(contacts.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Additional Contacts</span>
          {contacts.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{contacts.length}</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Existing contacts list */}
        {contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((c, idx) => (
              <div key={c.id || idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-xs font-bold">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.name}
                    {c.designation && <span className="text-xs text-gray-500 ml-1.5 font-normal">· {c.designation}</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    <p className="text-xs text-gray-600">{c.phone}</p>
                    {c.phone_2 && <p className="text-xs text-gray-500">{c.phone_2}</p>}
                    {c.email && <p className="text-xs text-blue-600">{c.email}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => handleRemove(idx)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new contact form */}
        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-white space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">+ Add Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="Contact name"
                value={draft.name}
                onChange={(e) => { setDraft({...draft, name: e.target.value}); setDraftErrors({...draftErrors, name: ''}); }}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${draftErrors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
              {draftErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{draftErrors.name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Designation</label>
              <input type="text" placeholder="e.g. Manager"
                value={draft.designation}
                onChange={(e) => setDraft({...draft, designation: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" placeholder="Primary phone"
                value={draft.phone}
                onChange={(e) => { setDraft({...draft, phone: e.target.value}); setDraftErrors({...draftErrors, phone: ''}); }}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${draftErrors.phone ? 'border-red-400' : 'border-gray-300'}`}
              />
              {draftErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{draftErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Phone 2</label>
              <input type="tel" placeholder="Secondary phone"
                value={draft.phone_2}
                onChange={(e) => setDraft({...draft, phone_2: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1">Email</label>
              <input type="email" placeholder="contact@example.com"
                value={draft.email}
                onChange={(e) => setDraft({...draft, email: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Reports() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filters, setFilters] = useState({ expo_id: '', industry_type: '', enquiry_type: '' });
  const [expos, setExpos] = useState([]);
  const [sources, setSources] = useState([]);
  const [industries, setIndustries] = useState([]);       // general (expo_id=null) industry names
  const [enquiries, setEnquiries] = useState([]);         // general (expo_id=null) enquiry names
  const [editEnquiries, setEditEnquiries] = useState([]); // scoped for edit modal
  const [editIndustries, setEditIndustries] = useState([]); // scoped for edit modal
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

  // Debounce search
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
      const params = {
        search: searchDebounced || undefined,
        search_field: searchField || undefined,
        ...filters,
      };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await customerApi.getAll(params);
      setCustomers(res.data.data || []);
    } catch {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, searchField, filters, isOnline, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isOnline) return;
    Promise.all([
      masterApi.getExpos(),
      masterApi.getSources(),
      masterApi.getEnquiryTypes(),   // returns enquiry_types_custom rows
      masterApi.getIndustryTypes(),  // returns industry_types_custom rows
      masterApi.getCurrentExpo(),
    ])
      .then(([e, src, eq, i, ce]) => {
        setExpos(e.data.data);
        setSources(src.data.data || []);
        // General entries = expo_id IS NULL
        const generalEnquiries = (eq.data.data || []).filter(x => !x.expo_id).map(x => x.name);
        const generalIndustries = (i.data.data || []).filter(x => !x.expo_id).map(x => x.name);
        setEnquiries(generalEnquiries);
        setIndustries(generalIndustries);
        setEditEnquiries(generalEnquiries);
        setEditIndustries(generalIndustries);
        const dbExpo = ce.data.data || null;
        cacheSelectedExpo(dbExpo);
        setCurrentExpo(dbExpo);
      })
      .catch(() => {});
  }, [isOnline]);

  // When the edit modal's expo changes, refresh scoped enquiry + industry lists
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

  // Add new source
  const handleAddSource = async (sourceName) => {
    try {
      const res = await masterApi.addSource({ source_name: sourceName });
      setSources([...sources, res.data.data]);
      return res.data.data;
    } catch (err) {
      console.error('Failed to add source:', err);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const paginatedCustomers = customers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Internet Connection</h2>
          <p className="text-sm text-gray-500">Reports require an active internet connection. Please connect to the network to view customer records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-gray-500 text-sm">
                {loading ? 'Loading...' : `${customers.length} customer${customers.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
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
            {/* Search row: field selector + search input */}
            <div className="flex gap-2">
              <div className="relative flex-shrink-0 w-44">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200"
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
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={searchField ? `Search by ${searchField.replace(/_/g, ' ')}...` : 'Search all fields...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter dropdowns — always visible */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-800 font-semibold mb-1.5">Expo</label>
                <div className="relative">
                  <select value={filters.expo_id} onChange={(e) => handleFilterChange('expo_id', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200">
                    <option value="">All Expos</option>
                    {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-800 font-semibold mb-1.5">Industry</label>
                <div className="relative">
                  <select value={filters.industry_type} onChange={(e) => handleFilterChange('industry_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200">
                    <option value="">All Industries</option>
                    {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-800 font-semibold mb-1.5">Enquiry Type</label>
                <div className="relative">
                  <select value={filters.enquiry_type} onChange={(e) => handleFilterChange('enquiry_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200">
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading customers...</p>
            </div>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3.645A2.645 2.645 0 013 18.355V5.645A2.645 2.645 0 015.645 3h12.71A2.645 2.645 0 0121 5.645v12.71A2.645 2.645 0 0118.355 21" />
            </svg>
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Expo / Source</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Enquiry Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{customer.customer_name}</p>
                          <p className="text-xs text-gray-500">{customer.designation || '—'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{customer.company_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <div className="text-xs space-y-1">
                          <p>{customer.phone_number}</p>
                          {customer.mobile_no_2 && <p className="text-gray-500">{customer.mobile_no_2}</p>}
                          {customer.email && <p className="text-blue-600 truncate">{customer.email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{customer.expo_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{customer.enquiry_type || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewRecord(customer)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditRecord(customer)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteId(customer.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={customers.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* View Modal */}
        {viewRecord && (
          <Modal title="Customer Details" onClose={() => setViewRecord(null)}>
            <div className="space-y-4">
              {/* Expo badge at top */}
              {viewRecord.expo_name && (
                <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold mb-0.5">Expo / Source</p>
                  <p className="text-sm font-semibold text-blue-800">{viewRecord.expo_name}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <div>
                  <DetailRow label="Customer Name" value={viewRecord.customer_name} />
                  <DetailRow label="Company Name" value={viewRecord.company_name} />
                  <DetailRow label="Designation" value={viewRecord.designation} />
                  <DetailRow label="Phone 1" value={viewRecord.phone_number} />
                  <DetailRow label="Phone 2" value={viewRecord.mobile_no_2} />
                </div>
                <div>
                  <DetailRow label="Email 1" value={viewRecord.email} />
                  <DetailRow label="Email 2" value={viewRecord.email_2} />
                  <DetailRow label="Website" value={viewRecord.website} />
                  <DetailRow label="Enquiry Type" value={viewRecord.enquiry_type} />
                  <DetailRow label="Industry Type" value={viewRecord.industry_type} />
                </div>
                <div className="md:col-span-2">
                  <DetailRow label="Location" value={viewRecord.location} />
                  <DetailRow label="City" value={viewRecord.city} />
                  <DetailRow label="Remarks" value={viewRecord.remarks} />
                </div>
              </div>

              {/* Additional contacts in view modal */}
              {viewRecord.additional_contacts?.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Additional Contacts</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{viewRecord.additional_contacts.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {viewRecord.additional_contacts.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-xs font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}
                            {c.designation && <span className="text-xs text-gray-500 ml-1.5 font-normal">· {c.designation}</span>}
                          </p>
                          <div className="flex flex-wrap gap-x-4 mt-0.5">
                            <p className="text-xs text-gray-600">{c.phone}</p>
                            {c.phone_2 && <p className="text-xs text-gray-500">{c.phone_2}</p>}
                            {c.email && <p className="text-xs text-blue-600">{c.email}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Edit Modal */}
        {editRecord && (
          <Modal title="Edit Customer" size="lg" onClose={() => setEditRecord(null)}>
            <form onSubmit={handleUpdate} className="space-y-4">

              {/* ── Expo Name / Source — at the TOP ── */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Expo Name / Source</label>
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

              {/* ── Core fields ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Customer Name *</label>
                  <input type="text" required value={editRecord.customer_name}
                    onChange={(e) => setEditRecord({...editRecord, customer_name: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Company Name *</label>
                  <input type="text" required value={editRecord.company_name}
                    onChange={(e) => setEditRecord({...editRecord, company_name: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Designation</label>
                  <input type="text" value={editRecord.designation || ''}
                    onChange={(e) => setEditRecord({...editRecord, designation: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Phone Number 1 *</label>
                  <input type="text" required value={editRecord.phone_number}
                    onChange={(e) => setEditRecord({...editRecord, phone_number: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Phone Number 2</label>
                  <input type="text" value={editRecord.mobile_no_2 || ''}
                    onChange={(e) => setEditRecord({...editRecord, mobile_no_2: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Email 1</label>
                  <input type="email" value={editRecord.email || ''}
                    onChange={(e) => setEditRecord({...editRecord, email: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Email 2</label>
                  <input type="email" value={editRecord.email_2 || ''}
                    onChange={(e) => setEditRecord({...editRecord, email_2: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Website</label>
                  <input type="text" value={editRecord.website || ''}
                    onChange={(e) => setEditRecord({...editRecord, website: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Enquiry Type</label>
                  <div className="relative">
                    <select value={editRecord.enquiry_type || ''}
                      onChange={(e) => setEditRecord({...editRecord, enquiry_type: e.target.value})}
                      className={getInputClasses(false)}>
                      <option value="">Select Type</option>
                      {editEnquiries.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                    </select>
                    
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Industry Type</label>
                  <div className="relative">
                    <select value={editRecord.industry_type || ''}
                      onChange={(e) => setEditRecord({...editRecord, industry_type: e.target.value})}
                      className={getInputClasses(false)}>
                      <option value="">Select Type</option>
                      {editIndustries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                    
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">City</label>
                  <input type="text" value={editRecord.city || ''}
                    onChange={(e) => setEditRecord({...editRecord, city: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Location</label>
                  <input type="text" value={editRecord.location || ''}
                    onChange={(e) => setEditRecord({...editRecord, location: e.target.value})}
                    className={getInputClasses(false)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-1.5">Remarks</label>
                <textarea value={editRecord.remarks || ''}
                  onChange={(e) => setEditRecord({...editRecord, remarks: e.target.value})}
                  className={getInputClasses(false)} rows="3" />
              </div>

              {/* ── Additional Contacts ────────────────────────────────────── */}
              <AdditionalContacts
                contacts={editRecord.additional_contacts || []}
                onChange={(contacts) => setEditRecord({...editRecord, additional_contacts: contacts})}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setEditRecord(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={updating}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50 transition-all">
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {deleteId && (
          <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m0 0a9 9 0 11-9-9 9 9 0 019 9z" />
              </svg>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this customer record? This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 transition-all"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}