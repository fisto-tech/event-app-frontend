import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { masterApi, customerApi } from '../services/api';
import { cacheMasterData, getCachedMasterData, saveOfflineCustomer } from '../services/offlineSync';
import { useToast } from '../components/Toast';

const FALLBACK_ENQUIRY = ['Website', 'Web App', 'Android App', 'Customised Software', 'ERP', 'CRM', 'Other'];
const FALLBACK_INDUSTRY = ['Agriculture', 'Adhesives', 'Packaging', 'Manufacturing', 'Education', 'Retail', 'IT', 'Healthcare', 'Other'];

const EMPTY_FORM = {
  expo_id: '', expo_name: '', company_name: '', customer_name: '',
  designation: '', phone_number: '', enquiry_type: '', email: '',
  location: '', city: '', industry_type: '', followup_date: '', remarks: '',
};

// ✅ Moved OUTSIDE the main component so they don't re-create on every render
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
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

// ✅ Helper functions for class names (pure functions, no re-creation issues)
function getInputClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500'
  }`;
}

function getSelectClasses(hasError) {
  return `w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500'
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

  useEffect(() => {
    loadMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadMasterData = async () => {
    if (isOnline) {
      try {
        const [expoRes, enquiryRes, industryRes] = await Promise.all([
          masterApi.getExpos(),
          masterApi.getEnquiryTypes(),
          masterApi.getIndustryTypes(),
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
      } catch {
        await loadFromCache();
      }
    } else {
      await loadFromCache();
    }
  };

  const loadFromCache = async () => {
    const cachedExpos = await getCachedMasterData('expos');
    const cachedEnquiry = await getCachedMasterData('enquiry_types');
    const cachedIndustry = await getCachedMasterData('industry_types');

    setExpos(cachedExpos || []);
    setEnquiryTypes(cachedEnquiry || FALLBACK_ENQUIRY);
    setIndustryTypes(cachedIndustry || FALLBACK_INDUSTRY);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'expo_id') {
        const expo = expos.find((ex) => String(ex.id) === String(value));
        updated.expo_name = expo?.expo_name || '';
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fix validation errors', 'warning');
      return;
    }

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
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      try {
        await saveOfflineCustomer(payload);
        addToast('API error. Saved offline for later sync.', 'warning');
        setForm(EMPTY_FORM);
      } catch {
        addToast('Failed to save. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register Customer</h1>
              <p className="text-gray-500 text-sm">Add a new customer lead from your expo</p>
            </div>
          </div>

          {/* Network Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 self-start ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            {isOnline ? 'Online' : 'Offline'}
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

        <form onSubmit={handleSubmit} noValidate className="space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Section: Expo Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                title="Expo Information"
                subtitle="Select the expo where this lead was collected"
              />
              <div className="max-w-md">
                <FieldWrapper label="Expo Name" error={errors.expo_id}>
                  <div className="relative">
                    <select
                      name="expo_id"
                      value={form.expo_id}
                      onChange={handleChange}
                      className={getSelectClasses(!!errors.expo_id)}
                    >
                      <option value="">Select an expo...</option>
                      {expos.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.expo_name}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Section: Customer Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                title="Customer Details"
                subtitle="Basic information about the customer"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Company Name" required error={errors.company_name}>
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className={getInputClasses(!!errors.company_name)}
                  />
                </FieldWrapper>

                <FieldWrapper label="Customer Name" required error={errors.customer_name}>
                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={getInputClasses(!!errors.customer_name)}
                  />
                </FieldWrapper>

                <FieldWrapper label="Designation" error={errors.designation}>
                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g. Manager, Director"
                    className={getInputClasses(!!errors.designation)}
                  />
                </FieldWrapper>

                <FieldWrapper label="Phone Number" required error={errors.phone_number}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="phone_number"
                      value={form.phone_number}
                      onChange={handleChange}
                      placeholder="+91 99999 99999"
                      className={`${getInputClasses(!!errors.phone_number)} pl-10`}
                    />
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Email Address" error={errors.email}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className={`${getInputClasses(!!errors.email)} pl-10`}
                    />
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Enquiry Type" error={errors.enquiry_type}>
                  <div className="relative">
                    <select
                      name="enquiry_type"
                      value={form.enquiry_type}
                      onChange={handleChange}
                      className={getSelectClasses(!!errors.enquiry_type)}
                    >
                      <option value="">Select enquiry type...</option>
                      {enquiryTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Section: Location & Industry */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                title="Location & Industry"
                subtitle="Where the customer is based and their industry"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrapper label="Location / Address" error={errors.location}>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Enter address or area"
                    className={getInputClasses(!!errors.location)}
                  />
                </FieldWrapper>

                <FieldWrapper label="City" error={errors.city}>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Enter city name"
                    className={getInputClasses(!!errors.city)}
                  />
                </FieldWrapper>

                <FieldWrapper label="Industry Type" error={errors.industry_type}>
                  <div className="relative">
                    <select
                      name="industry_type"
                      value={form.industry_type}
                      onChange={handleChange}
                      className={getSelectClasses(!!errors.industry_type)}
                    >
                      <option value="">Select industry...</option>
                      {industryTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Next Follow-up Date" error={errors.followup_date}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="followup_date"
                      value={form.followup_date}
                      onChange={handleChange}
                      className={`${getInputClasses(!!errors.followup_date)} pl-10`}
                    />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>

          {/* Section: Remarks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionHeader
                icon={
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Additional Notes"
                subtitle="Any remarks or special requirements"
              />
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={4}
                placeholder="Add any notes, requirements, or observations about the customer..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky bottom-0">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Employee Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Employee ID: {user?.id}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] ${
                      loading
                        ? 'bg-indigo-400 text-white cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : isOnline ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Register Customer
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Save Offline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}