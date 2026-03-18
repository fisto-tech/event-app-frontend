import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { customerApi } from '../services/api';
import { getPendingCount } from '../services/offlineSync';

const DashCard = ({ title, subtitle, icon, onClick, accent = false, badge }) => (
  <button
    onClick={onClick}
    className={`text-left rounded-2xl border p-6 transition-all duration-200 group w-full cursor-pointer ${
      accent
        ? 'bg-gradient-to-br from-gray-900 to-black text-white border-gray-900 shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-1'
        : 'bg-white text-gray-900 border-gray-300 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1'
    }`}
  >
    <div className="flex items-start justify-between mb-5">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
          accent
            ? 'bg-white/10 border border-white/20'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        {icon}
      </div>
      {badge !== undefined && (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            badge > 0
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}
        >
          {badge > 0 ? `${badge} pending` : '✓ synced'}
        </span>
      )}
    </div>
    <h3 className={`font-bold text-base mb-1.5 ${accent ? 'text-white' : 'text-gray-900'}`}>
      {title}
    </h3>
    <p className={`text-xs leading-relaxed ${accent ? 'text-gray-400' : 'text-gray-500'}`}>
      {subtitle}
    </p>
    <div
      className={`mt-4 flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1 ${
        accent ? 'text-gray-300' : 'text-gray-500'
      }`}
    >
      Open
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>
  </button>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const count = await getPendingCount();
      setPendingCount(count);

      if (isOnline) {
        try {
          const res = await customerApi.getAll();
          const customers = res.data.data || [];
          const today = new Date().toDateString();
          const todayCount = customers.filter(
            (c) => new Date(c.created_at).toDateString() === today
          ).length;
          setStats({ total: customers.length, today: todayCount });
        } catch {
          // ignore
        }
      }
      setLoadingStats(false);
    };
    loadData();
  }, [isOnline]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const cards = [
    {
      title: 'Master Data',
      subtitle: 'Manage event names, enquiry types, industry types, and templates',
      icon: '⬡',
      path: '/master',
      adminOnly: true,
    },
    {
      title: 'Register Customer',
      subtitle: 'Add new customer leads. Works offline with auto-sync',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      path: '/customers/register',
      accent: true,
      badge: pendingCount,
    },
    {
      title: 'Customer Reports',
      subtitle: 'View, search, filter and manage all registered customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/reports',
    },
    {
      title: 'Employees',
      subtitle: 'Manage team members and their access roles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/employees',
      adminOnly: true,
    },
  ];

  const visibleCards = cards.filter((c) => !c.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto p-5 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-bold text-2xl lg:text-3xl text-gray-900">
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {user?.name?.split(' ')[0]}
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-1.5">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div
              className={`flex items-center gap-2.5 text-xs font-semibold px-4 py-2 rounded-full border ${
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <span className="relative flex items-center justify-center w-2.5 h-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? 'bg-emerald-400 animate-ping' : 'bg-red-400 animate-ping'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              </span>
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
          </div>
        </div>

        {/* Stat chips */}
        {isOnline && !loadingStats && (
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-2xl text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Customers</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-2xl text-gray-900">{stats.today}</p>
                <p className="text-xs text-gray-500">Registered Today</p>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-2xl text-amber-800">{pendingCount}</p>
                  <p className="text-xs text-amber-700">Pending Sync</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loadingStats && isOnline && (
          <div className="flex flex-wrap gap-4 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div>
                  <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {visibleCards.map((card) => (
            <DashCard
              key={card.path}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              accent={card.accent}
              badge={card.badge}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-900">You're currently offline</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Customer registration still works. All records will sync automatically when you
                reconnect to the internet.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Fist-o Event App • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}