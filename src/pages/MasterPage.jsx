import React, { useState, useEffect } from 'react';
import { masterApi } from '../services/api';
import { useToast } from '../components/Toast';

const TABS = [
  { key: 'expos', label: 'Expo Names', icon: '🎪', description: 'Manage exhibition and expo entries' },
  { key: 'enquiry', label: 'Enquiry Types', icon: '📋', description: 'Define enquiry categories' },
  { key: 'industry', label: 'Industry Types', icon: '🏭', description: 'Manage industry classifications' },
  { key: 'sms', label: 'SMS Templates', icon: '💬', description: 'Create and manage SMS templates' },
  { key: 'whatsapp', label: 'WhatsApp Templates', icon: '📱', description: 'WhatsApp message templates' },
  { key: 'email', label: 'Email Templates', icon: '✉️', description: 'Email communication templates' },
];

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium text-sm">No {label} found</p>
      <p className="text-gray-400 text-xs mt-1">Add your first entry using the form above</p>
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
      <p className="text-gray-400 text-sm">Loading data...</p>
    </div>
  );
}

function SimpleListTab({ data, onAdd, onDelete, loading, fields, addLabel, tabLabel }) {
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  const isFormValid = fields.every((f) => form[f.name]?.trim());

  const handleAdd = async () => {
    if (!isFormValid) return;
    setAdding(true);
    try {
      await onAdd(form);
      setForm({});
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setShowConfirm(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isFormValid && !adding) {
      handleAdd();
    }
  };

  return (
    <div className="space-y-6 max-h-[55vh] overflow-y-auto">
      {/* Add Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{addLabel}</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.name} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    placeholder={f.placeholder}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={adding || !isFormValid}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isFormValid && !adding
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Entry
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Data List Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 text-sm">All Entries</h3>
            {!loading && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {data.length}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState label={tabLabel} />
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item, i) => (
              <div
                key={item.id}
                className="group flex items-start gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors duration-150"
              >
                {/* Index badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    {fields.map((f) => (
                      <div key={f.name}>
                        {fields.length > 1 && (
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{f.label}</span>
                        )}
                        <p className={`text-gray-800 ${f.type === 'textarea' ? 'text-sm leading-relaxed' : 'text-sm font-medium'}`}>
                          {item[f.name]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {item.status && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {item.status}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Delete action */}
                <div className="flex-shrink-0 relative">
                  {showConfirm === item.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          'Yes'
                        )}
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(item.id)}
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState('expos');
  const [data, setData] = useState({
    expos: [],
    enquiry: [],
    industry: [],
    sms: [],
    whatsapp: [],
    email: [],
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab]);

  const loadTab = async (tab) => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'expos': res = await masterApi.getExpos(); break;
        case 'enquiry': res = await masterApi.getEnquiryTypes(); break;
        case 'industry': res = await masterApi.getIndustryTypes(); break;
        case 'sms': res = await masterApi.getSmsTemplates(); break;
        case 'whatsapp': res = await masterApi.getWhatsappTemplates(); break;
        case 'email': res = await masterApi.getEmailTemplates(); break;
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
        case 'expos': await masterApi.createExpo(form); break;
        case 'enquiry': await masterApi.createEnquiryType(form); break;
        case 'industry': await masterApi.createIndustryType(form); break;
        case 'sms': await masterApi.createSmsTemplate(form); break;
        case 'whatsapp': await masterApi.createWhatsappTemplate(form); break;
        case 'email': await masterApi.createEmailTemplate(form); break;
      }
      addToast('Added successfully', 'success');
      loadTab(tab);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add', 'error');
    }
  };

  const handleDelete = async (tab, id) => {
    try {
      switch (tab) {
        case 'expos': await masterApi.deleteExpo(id); break;
        case 'enquiry': await masterApi.deleteEnquiryType(id); break;
        case 'industry': await masterApi.deleteIndustryType(id); break;
        case 'sms': await masterApi.deleteSmsTemplate(id); break;
        case 'whatsapp': await masterApi.deleteWhatsappTemplate(id); break;
        case 'email': await masterApi.deleteEmailTemplate(id); break;
      }
      addToast('Deleted successfully', 'success');
      loadTab(tab);
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const tabConfig = {
    expos: {
      addLabel: 'Add New Expo',
      fields: [{ name: 'expo_name', placeholder: 'Enter expo name...', label: 'Expo Name' }],
    },
    enquiry: {
      addLabel: 'Add Enquiry Type',
      fields: [{ name: 'name', placeholder: 'Enter enquiry type name...', label: 'Name' }],
    },
    industry: {
      addLabel: 'Add Industry Type',
      fields: [{ name: 'name', placeholder: 'Enter industry type name...', label: 'Name' }],
    },
    sms: {
      addLabel: 'Add SMS Template',
      fields: [
        { name: 'title', placeholder: 'Enter template title...', label: 'Title' },
        { name: 'content', placeholder: 'Enter SMS content...', label: 'Content', type: 'textarea' },
      ],
    },
    whatsapp: {
      addLabel: 'Add WhatsApp Template',
      fields: [
        { name: 'title', placeholder: 'Enter template title...', label: 'Title' },
        { name: 'content', placeholder: 'Enter WhatsApp message content...', label: 'Content', type: 'textarea' },
      ],
    },
    email: {
      addLabel: 'Add Email Template',
      fields: [
        { name: 'title', placeholder: 'Enter template title...', label: 'Title' },
        { name: 'subject', placeholder: 'Enter email subject line...', label: 'Subject' },
        { name: 'content', placeholder: 'Enter email body content...', label: 'Content', type: 'textarea' },
      ],
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Data</h1>
              <p className="text-gray-500 text-sm">Manage lookup data used across the application</p>
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
          <div className="flex items-center gap-2 mb-6 px-1">
            <span className="text-2xl">{activeTabInfo.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{activeTabInfo.label}</h2>
              <p className="text-xs text-gray-400">{activeTabInfo.description}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <SimpleListTab
          key={activeTab}
          data={data[activeTab]}
          loading={loading}
          onAdd={(form) => handleAdd(activeTab, form)}
          onDelete={(id) => handleDelete(activeTab, id)}
          fields={tabConfig[activeTab].fields}
          addLabel={tabConfig[activeTab].addLabel}
          tabLabel={activeTabInfo?.label}
        />
      </div>
    </div>
  );
}