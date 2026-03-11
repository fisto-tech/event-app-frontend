import React, { useState, useEffect, useCallback } from 'react';
import { customerApi, masterApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

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
          size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
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
            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-sm'
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
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="py-2.5 px-1">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function getInputClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500'
  }`;
}

export default function Reports() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filters, setFilters] = useState({ expo_id: '', industry_type: '', enquiry_type: '' });
  const [expos, setExpos] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
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

  const loadData = useCallback(async () => {
    if (!isOnline) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = { search: searchDebounced || undefined, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await customerApi.getAll(params);
      setCustomers(res.data.data || []);
    } catch {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, filters, isOnline, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isOnline) return;
    Promise.all([masterApi.getExpos(), masterApi.getEnquiryTypes(), masterApi.getIndustryTypes()])
      .then(([e, eq, i]) => {
        setExpos(e.data.data);
        setEnquiries(eq.data.data.map((x) => x.name));
        setIndustries(i.data.data.map((x) => x.name));
      })
      .catch(() => {});
  }, [isOnline]);

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
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
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
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
          {/* Search bar — always visible */}
          <div className="p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, company, phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter dropdowns — collapsible */}
          {showFilters && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Expo</label>
                  <div className="relative">
                    <select
                      value={filters.expo_id}
                      onChange={(e) => handleFilterChange('expo_id', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all duration-200"
                    >
                      <option value="">All Expos</option>
                      {expos.map((ex) => <option key={ex.id} value={ex.id}>{ex.expo_name}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Industry</label>
                  <div className="relative">
                    <select
                      value={filters.industry_type}
                      onChange={(e) => handleFilterChange('industry_type', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all duration-200"
                    >
                      <option value="">All Industries</option>
                      {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Enquiry Type</label>
                  <div className="relative">
                    <select
                      value={filters.enquiry_type}
                      onChange={(e) => handleFilterChange('enquiry_type', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all duration-200"
                    >
                      <option value="">All Enquiries</option>
                      {enquiries.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  {['#', 'Expo', 'Company', 'Customer', 'Phone', 'City', 'Industry', 'Follow-up', 'Employee', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-20">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-10 h-10 mb-3">
                          <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
                        </div>
                        <p className="text-sm text-gray-400">Loading customer records...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500">No customers found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c, idx) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={c.id} className="group hover:bg-indigo-50/30 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-500">
                            {globalIdx}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate" title={c.expo_name}>
                          {c.expo_name || '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[150px]">
                          <p className="text-sm font-semibold text-gray-900 truncate" title={c.company_name}>{c.company_name}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[130px]">
                          <p className="text-sm text-gray-700 truncate" title={c.customer_name}>{c.customer_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-600 whitespace-nowrap">{c.phone_number}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.city || '—'}</td>
                        <td className="px-4 py-3">
                          {c.industry_type ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                              {c.industry_type}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.followup_date ? (
                            <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
                              {new Date(c.followup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.employee_name || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => setViewRecord(c)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditRecord({ ...c })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteId(c.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && customers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={customers.length}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* View Modal */}
        {viewRecord && (
          <Modal title="Customer Details" onClose={() => setViewRecord(null)} size="lg">
            <div className="space-y-4">
              {/* Customer header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-indigo-600">
                    {viewRecord.customer_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{viewRecord.customer_name}</h3>
                  <p className="text-sm text-gray-500">{viewRecord.company_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                <DetailRow label="Designation" value={viewRecord.designation} />
                <DetailRow label="Phone" value={viewRecord.phone_number} />
                <DetailRow label="Email" value={viewRecord.email} />
                <DetailRow label="City" value={viewRecord.city} />
                <DetailRow label="Location" value={viewRecord.location} />
                <DetailRow label="Enquiry Type" value={viewRecord.enquiry_type} />
                <DetailRow label="Industry" value={viewRecord.industry_type} />
                <DetailRow label="Expo" value={viewRecord.expo_name} />
                <DetailRow label="Employee" value={viewRecord.employee_name} />
                <DetailRow
                  label="Follow-up Date"
                  value={viewRecord.followup_date ? new Date(viewRecord.followup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null}
                />
                <DetailRow
                  label="Registered On"
                  value={new Date(viewRecord.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                />
              </div>

              {viewRecord.remarks && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Remarks</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{viewRecord.remarks}</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Edit Modal */}
        {editRecord && (
          <Modal title="Edit Customer" onClose={() => setEditRecord(null)} size="lg">
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['company_name', 'Company Name', 'text'],
                  ['customer_name', 'Customer Name', 'text'],
                  ['designation', 'Designation', 'text'],
                  ['phone_number', 'Phone Number', 'tel'],
                  ['email', 'Email', 'email'],
                  ['city', 'City', 'text'],
                  ['location', 'Location', 'text'],
                  ['enquiry_type', 'Enquiry Type', 'select-enquiry'],
                  ['industry_type', 'Industry Type', 'select-industry'],
                  ['followup_date', 'Follow-up Date', 'date'],
                ].map(([field, label, type]) => (
                  <div key={field}>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                      {label}
                    </label>
                    {type === 'select-enquiry' ? (
                      <div className="relative">
                        <select
                          value={editRecord[field] || ''}
                          onChange={(e) => setEditRecord((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all duration-200"
                        >
                          <option value="">Select...</option>
                          {enquiries.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                        </select>
                        <SelectChevron />
                      </div>
                    ) : type === 'select-industry' ? (
                      <div className="relative">
                        <select
                          value={editRecord[field] || ''}
                          onChange={(e) => setEditRecord((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all duration-200"
                        >
                          <option value="">Select...</option>
                          {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <SelectChevron />
                      </div>
                    ) : type === 'date' ? (
                      <input
                        type="date"
                        value={editRecord[field] ? editRecord[field].split('T')[0] : ''}
                        onChange={(e) => setEditRecord((prev) => ({ ...prev, [field]: e.target.value }))}
                        className={getInputClasses(false)}
                      />
                    ) : (
                      <input
                        type={type}
                        value={editRecord[field] || ''}
                        onChange={(e) => setEditRecord((prev) => ({ ...prev, [field]: e.target.value }))}
                        className={getInputClasses(false)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Remarks</label>
                <textarea
                  value={editRecord.remarks || ''}
                  onChange={(e) => setEditRecord((prev) => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                    updating
                      ? 'bg-indigo-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  {updating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <Modal title="Delete Customer" onClose={() => setDeleteId(null)}>
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                This action cannot be undone. The customer record will be permanently deleted from the system.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                    deleting
                      ? 'bg-red-400 text-white cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'
                  }`}
                >
                  {deleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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