import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { followupApi } from '../services/api';
import { useToast } from '../components/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'first_followup', label: 'First Follow-up', tw: 'bg-indigo-100 text-indigo-700 border-indigo-300', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-500', activeText: 'text-indigo-700', dot: 'bg-indigo-500', accent: '#6366f1' },
  { key: 'proposal', label: 'Proposal', tw: 'bg-amber-100 text-amber-700 border-amber-300', activeBg: 'bg-amber-50', activeBorder: 'border-amber-500', activeText: 'text-amber-700', dot: 'bg-amber-500', accent: '#f59e0b' },
  { key: 'lead', label: 'Lead', tw: 'bg-emerald-100 text-emerald-700 border-emerald-300', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-500', activeText: 'text-emerald-700', dot: 'bg-emerald-500', accent: '#10b981' },
  { key: 'confirm', label: 'Confirm', tw: 'bg-blue-100 text-blue-700 border-blue-300', activeBg: 'bg-blue-50', activeBorder: 'border-blue-500', activeText: 'text-blue-700', dot: 'bg-blue-500', accent: '#3b82f6' },
];

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ children, className = '', size = 16 }) => (
  <svg className={`shrink-0 ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IconArrowLeft = ({ className }) => (<Icon className={className}><polyline points="15 18 9 12 15 6" /></Icon>);
const IconChevronDown = ({ className }) => (<Icon className={className} size={14}><polyline points="6 9 12 15 18 9" /></Icon>);
const IconBuilding = ({ className }) => (
  <Icon className={className}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
  </Icon>
);
const IconUser = ({ className }) => (
  <Icon className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
);
const IconPhone = ({ className }) => (
  <Icon className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.3a16 16 0 0 0 5.8 5.8l.91-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);
const IconMapPin = ({ className }) => (
  <Icon className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Icon>
);
const IconTag = ({ className }) => (
  <Icon className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Icon>
);
const IconCalendar = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);
const IconSave = ({ className }) => (
  <Icon className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </Icon>
);
const IconBriefcase = ({ className }) => (
  <Icon className={className}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></Icon>
);
const IconWhatsApp = ({ className }) => (
  <svg className={`shrink-0 ${className || ''}`} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IconEmailShare = ({ className }) => (
  <Icon className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Icon>
);
const IconCheck = ({ className }) => (
  <Icon className={className} size={14}><polyline points="20 6 9 17 4 12" /></Icon>
);
const IconFileText = ({ className }) => (
  <Icon className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </Icon>
);
const IconCornerDownRight = ({ className }) => (
  <Icon className={className} size={14}>
    <polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" />
  </Icon>
);

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-gray-300 rounded-2xl bg-white mt-5 shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full px-5 py-4 bg-transparent hover:bg-gray-50 
                   transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset 
                   focus:ring-indigo-300"
        type="button"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-gray-500">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        <span className={`text-gray-800 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </span>
      </button>
      <div className={`transition-all duration-200 ease-in-out ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-5 pb-5 pt-2 border-t-2 border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Read-only Input Field (looks like input but not editable) ────────────────
function ROField({ label, value, mono, icon }) {
  return (
    <div className="min-w-0">
      <label className="block text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-1.5 ">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value || '—'}
          readOnly
          tabIndex={-1}
          className={`w-full px-3.5 py-2.5 border-1 border-gray-700 rounded-xl text-sm 
                      bg-gray-50 cursor-default select-text outline-none
                      ${value ? 'text-gray-700' : 'text-gray-300'}
                      ${mono ? '' : ''}
                      ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

// ─── Editable Input Field ─────────────────────────────────────────────────────
function InputField({ label, required, value, onChange, type = 'text', placeholder, error, readOnly, icon }) {
  return (
    <div className="min-w-0">
      <label className="block text-[12px] font-bold text-gray-800 uppercase tracking-wider mb-1.5 ">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-3.5 py-2.5 border-1 border-gray-700 rounded-xl text-sm text-gray-800 
                      placeholder:text-gray-400 outline-none transition-all duration-150
                      ${icon ? 'pl-9' : ''}
                      ${error
              ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : readOnly
                ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                : 'border-gray-300 bg-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600'
            }`}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 mt-1.5 font-medium flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main FollowupPage ────────────────────────────────────────────────────────
export default function FollowupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedContactIdx, setSelectedContactIdx] = useState(-1);
  const [contact, setContact] = useState({ name: '', designation: '', phone: '', email: '' });
  const [contactErrors, setContactErrors] = useState({});

  const [remarks, setRemarks] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [followupStage, setFollowupStage] = useState('first_followup');
  const [shareWhatsapp, setShareWhatsapp] = useState(false);
  const [shareEmail, setShareEmail] = useState(false);

  useEffect(() => {
    followupApi.getDetail(id).then((res) => {
      if (res.success) {
        setDetail(res.data);
        setFollowupStage(res.data.customer.current_stage || 'first_followup');
        setContact({
          name: res.data.customer.customer_name || '',
          designation: res.data.customer.designation || '',
          phone: res.data.customer.phone_number || '',
          email: res.data.customer.email || '',
        });
        if (res.data.latestLog?.shares_locked) {
          setShareWhatsapp(!!res.data.latestLog.share_whatsapp);
          setShareEmail(!!res.data.latestLog.share_email);
        }
      } else {
        addToast('Failed to load customer detail', 'error');
      }
      setLoading(false);
    });
  }, [id]);

  const customer = detail?.customer;
  const contacts = detail?.contacts || [];
  const sharesLocked = detail?.latestLog?.shares_locked === 1;
  const isProposal = followupStage === 'proposal';

  const applyContact = (idx) => {
    const c = contacts[idx];
    if (!c) return;
    setSelectedContactIdx(idx);
    setContact({
      name: c.contact_name,
      designation: c.contact_designation || '',
      phone: c.contact_phone,
      email: c.contact_email || '',
    });
  };

  const validate = () => {
    const errs = {};
    if (!contact.name.trim()) errs.name = 'Contact name is required';
    if (!contact.phone.trim()) errs.phone = 'Phone number is required';
    if (!remarks.trim()) errs.remarks = 'Please add remarks';
    if (!nextFollowupDate) errs.nextFollowupDate = 'Next follow-up date is required';
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await followupApi.createLog(id, {
        contact_name: contact.name,
        contact_designation: contact.designation,
        contact_phone: contact.phone,
        contact_email: contact.email,
        followup_stage: followupStage,
        remarks,
        next_followup_date: nextFollowupDate,
        share_whatsapp: isProposal ? shareWhatsapp : false,
        share_email: isProposal ? shareEmail : false,
      });
      if (res.success) {
        addToast('Follow-up saved successfully', 'success');
        navigate(-1);
      } else {
        addToast(res.message || 'Failed to save follow-up', 'error');
      }
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm  text-gray-400">Loading customer details…</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <IconUser className="text-gray-300 w-8 h-8" />
        </div>
        <p className="text-gray-400  text-sm">Customer not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border-2 
                     border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const stage = STAGES.find((s) => s.key === followupStage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-sans">
      {/* ─── Back + Header ─── */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 
                     bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 
                     active:scale-[0.98] shadow-sm"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Back to Follow-ups</span>
        </button>

        <div className="flex items-start sm:items-center gap-4 mt-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-100 text-indigo-600 
                          flex items-center justify-center shrink-0 border-2 border-indigo-200">
            <IconBuilding className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate capitalize">
              {customer.company_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-500 ">{customer.customer_name}</span>
              {stage && (
                <span className={`text-[10px] font-bold  px-2.5 py-1 rounded-full ${stage.tw}`}>
                  {stage.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Single Column Stacked Layout ─── */}
      <div className="flex flex-col max-h-[68vh] overflow-y-auto overflow-x-hidden">

        {/* ═══ SECTION 1: Customer Information ═══ */}
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md ">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-2 border-gray-100 bg-gray-50/50">
            <IconUser className="text-indigo-500 w-4 h-4" />
            <span className="text-sm font-bold text-gray-900">Customer Information</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ROField label="Company Name" value={customer.company_name} icon={<IconBuilding className="w-3.5 h-3.5" />} />
              <ROField label="Contact Person" value={customer.customer_name} icon={<IconUser className="w-3.5 h-3.5" />} />
              <ROField label="Designation" value={customer.designation} />
              <ROField label="Phone" value={customer.phone_number} mono icon={<IconPhone className="w-3.5 h-3.5" />} />
              <ROField label="Email" value={customer.email} mono icon={<IconEmailShare className="w-3.5 h-3.5" />} />
              <ROField label="Enquiry Type" value={customer.enquiry_type} icon={<IconTag className="w-3.5 h-3.5" />} />
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: Location & Industry (Accordion) ═══ */}
        <AccordionSection title="Location & Industry" icon={<IconMapPin className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ROField label="Location" value={customer.location} icon={<IconMapPin className="w-3.5 h-3.5" />} />
            <ROField label="City" value={customer.city} />
            <ROField label="Industry" value={customer.industry_type} />
            <ROField label="Expo" value={customer.expo_name} />
          </div>
        </AccordionSection>

        {/* ═══ SECTION 3: Messaging & Notes (Accordion) ═══ */}
        <AccordionSection title="Messaging & Notes" icon={<IconTag className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ROField label="SMS Sent" value={customer.sms_sent ? 'Yes' : 'No'} />
            <ROField label="WhatsApp Sent" value={customer.wa_sent ? 'Yes' : 'No'} />
            <ROField
              label="Registered On"
              value={customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '—'}
              icon={<IconCalendar className="w-3.5 h-3.5" />}
            />
            <ROField label="Employee" value={customer.employee_name} icon={<IconUser className="w-3.5 h-3.5" />} />
          </div>
          {customer.remarks && (
            <div className="mt-4">
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 ">
                Original Remarks
              </label>
              <textarea
                value={customer.remarks}
                readOnly
                rows={3}
                tabIndex={-1}
                className="w-full px-3.5 py-2.5 border-1 border-black rounded-xl text-sm 
                           bg-gray-50 text-gray-700 cursor-default resize-none outline-none leading-relaxed"
              />
            </div>
          )}
        </AccordionSection>

        

        {/* ═══ SECTION 4: Previous Contacts Table ═══ */}
        {contacts.length > 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md ">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <IconUser className="text-emerald-500 w-4 h-4" />
                <span className="text-sm font-bold text-gray-900">Previous Contacts</span>
                <span className="text-[11px]  bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              </div>
              <p className="text-[11px]  text-gray-400 hidden sm:block">
                Click "Apply" to auto-fill contact fields below
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500  uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500  uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500  uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500  uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500  uppercase tracking-wider w-24">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {contacts.map((c, i) => {
                    const isApplied = selectedContactIdx === i;
                    return (
                      <tr
                        key={i}
                        className={`transition-colors ${isApplied
                          ? 'bg-emerald-50'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-800">{c.contact_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{c.contact_designation || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm  text-gray-600">{c.contact_phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm  text-gray-500 truncate block max-w-[180px]">
                            {c.contact_email || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                                           bg-emerald-100 text-emerald-700 text-xs font-bold border-2 border-emerald-300">
                              <IconCheck className="w-3 h-3" />
                              Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => applyContact(i)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                                         bg-indigo-50 text-indigo-600 text-xs font-bold border-2 border-indigo-200
                                         hover:bg-indigo-100 hover:border-indigo-300 transition-colors
                                         focus:outline-none focus:ring-2 focus:ring-indigo-300 active:scale-95"
                            >
                              <IconCornerDownRight className="w-3 h-3" />
                              Apply
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y-2 divide-gray-100">
              {contacts.map((c, i) => {
                const isApplied = selectedContactIdx === i;
                return (
                  <div
                    key={i}
                    className={`p-4 transition-colors ${isApplied ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-gray-800">{c.contact_name}</p>
                        {c.contact_designation && (
                          <p className="text-xs text-gray-500">{c.contact_designation}</p>
                        )}
                        <p className="text-xs  text-gray-600">{c.contact_phone}</p>
                        {c.contact_email && (
                          <p className="text-xs  text-gray-400 truncate">{c.contact_email}</p>
                        )}
                      </div>
                      {isApplied ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg 
                                         bg-emerald-100 text-emerald-700 text-[11px] font-bold border-2 border-emerald-300">
                          <IconCheck className="w-3 h-3" />
                          Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => applyContact(i)}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg 
                                     bg-indigo-50 text-indigo-600 text-[11px] font-bold border-2 border-indigo-200
                                     hover:bg-indigo-100 transition-colors active:scale-95"
                        >
                          <IconCornerDownRight className="w-3 h-3" />
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ SECTION 5: Contact Details Form ═══ */}
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md mt-5">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-2 border-gray-100 bg-gray-50/50">
            <IconPhone className="text-emerald-500 w-4 h-4" />
            <span className="text-sm font-bold text-gray-900">Contact for This Follow-up</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Contact Name" required
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                placeholder="Full name"
                error={contactErrors.name}
                icon={<IconUser className="w-3.5 h-3.5" />}
              />
              <InputField
                label="Designation"
                value={contact.designation}
                onChange={(e) => setContact({ ...contact, designation: e.target.value })}
                placeholder="Role / title"
              />
              <InputField
                label="Phone Number" required type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                placeholder="+91 99999 99999"
                error={contactErrors.phone}
                icon={<IconPhone className="w-3.5 h-3.5" />}
              />
              <InputField
                label="Email (optional)" type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="email@example.com"
                icon={<IconEmailShare className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
        </div>

        {/* ═══ SECTION 6: Follow-up Stage ═══ */}
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md mt-5">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-2 border-gray-100 bg-gray-50/50">
            <IconBriefcase className="text-amber-500 w-4 h-4" />
            <span className="text-sm font-bold text-gray-900">Follow-up Stage</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STAGES.map((s) => {
                const active = followupStage === s.key;
                return (
                  <label
                    key={s.key}
                    className={`relative flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl 
                                border-2 cursor-pointer transition-all duration-150 text-center
                                ${active
                        ? `${s.activeBorder} ${s.activeBg} ring-2 ring-offset-1`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    style={active ? { '--tw-ring-color': `${s.accent}33` } : {}}
                  >
                    <input
                      type="radio"
                      name="followup_stage"
                      value={s.key}
                      checked={active}
                      onChange={() => setFollowupStage(s.key)}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 rounded-full ${active ? s.dot : 'bg-gray-300'} transition-colors`} />
                    <span className={`text-xs font-semibold ${active ? s.activeText : 'text-gray-500'} transition-colors leading-tight`}>
                      {s.label}
                    </span>
                    {active && (
                      <div className="absolute -top-1 -right-1">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: s.accent }}>
                          <IconCheck className="text-white w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Share Options — only when proposal, individual lock per channel */}
            {isProposal && (
              <div className="mt-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <p className="text-xs font-bold text-amber-800  mb-3 flex items-center gap-2">
                  <IconFileText className="w-3.5 h-3.5" />
                  SHARE PROPOSAL
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* WhatsApp */}
                  {(() => {
                    const whatsappLocked = sharesLocked && detail?.latestLog?.share_whatsapp;
                    return (
                      <label
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer 
                                    transition-all flex-1
                                    ${shareWhatsapp
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                                    ${whatsappLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={shareWhatsapp}
                          onChange={(e) => !whatsappLocked && setShareWhatsapp(e.target.checked)}
                          disabled={whatsappLocked}
                          className="w-4 h-4 accent-green-500 shrink-0"
                        />
                        <IconWhatsApp className="text-green-500" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700 block">WhatsApp</span>
                          {whatsappLocked && (
                            <span className="text-[10px] text-amber-600  flex items-center gap-1 mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Already sent
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}

                  {/* Email */}
                  {(() => {
                    const emailLocked = sharesLocked && detail?.latestLog?.share_email;
                    return (
                      <label
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer 
                                    transition-all flex-1
                                    ${shareEmail
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                                    ${emailLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={shareEmail}
                          onChange={(e) => !emailLocked && setShareEmail(e.target.checked)}
                          disabled={emailLocked}
                          className="w-4 h-4 accent-indigo-500 shrink-0"
                        />
                        <IconEmailShare className="text-indigo-500" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700 block">Email</span>
                          {emailLocked && (
                            <span className="text-[10px] text-amber-600  flex items-center gap-1 mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Already sent
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SECTION 7: Remarks & Next Follow-up ═══ */}
        <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-md mt-5">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b-2 border-gray-100 bg-gray-50/50">
            <IconCalendar className="text-blue-500 w-4 h-4" />
            <span className="text-sm font-bold text-gray-900">Remarks & Next Follow-up</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {/* Remarks */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 ">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter notes from this follow-up call or meeting…"
                rows={4}
                className={`w-full px-3.5 py-2.5 border-1 border-gray-800 rounded-xl text-sm text-gray-900 
                            placeholder:text-gray-400 outline-none transition-all duration-150 resize-y 
                            leading-relaxed
                            ${contactErrors.remarks
                    ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-black bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-200'
                  }`}
              />
              {contactErrors.remarks && (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {contactErrors.remarks}
                </p>
              )}
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 ">
                Next Follow-up Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <IconCalendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 border-1 rounded-xl text-sm text-gray-800 
                               outline-none transition-all duration-150 cursor-pointer
                              ${contactErrors.nextFollowupDate
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-800 bg-white hover:border-black focus:border-gray-500 focus:ring-2 focus:ring-gray-200'
                    }`}
                />
              </div>
              {contactErrors.nextFollowupDate && (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {contactErrors.nextFollowupDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SAVE BUTTON ═══ */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent pt-4 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-fit-content px-3 flex items-center justify-center gap-2.5 py-4 rounded-2xl 
                        text-white text-sm font-bold tracking-wide shadow-lg 
                        transition-all duration-200 border-2 border-indigo-600 cursor-pointer ml-auto
                        ${saving
                ? 'bg-indigo-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-600'
              }`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <IconSave className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving Follow-up…' : 'Save Follow-up'}</span>
          </button>
          <p className="text-center text-[11px] text-gray-400  mt-2">
            This will create a follow-up log and schedule the next date.
          </p>
        </div>
      </div>
    </div>
  );
}