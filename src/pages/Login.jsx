import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import logoImage from '../assets/images/logo.png';
import { subscribeUser } from "../utils/pushNotifications";


export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      addToast('Please enter username and password', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '📡', text: 'Offline-first registration' },
    { icon: '🔄', text: 'Auto sync when online' },
    { icon: '📊', text: 'Master data management' },
    { icon: '👥', text: 'Team management' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col lg:flex-row">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top section */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-18 h-18 rounded-xl bg-white backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              
                <img src={logoImage} alt='logo image' />
              
            </div>
            <span className="font-bold text-lg tracking-widest uppercase">
              EVENT APP
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] mb-6">
            Customer
            <br />
            Registration
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              & Management
            </span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Manage expo leads, register customers offline, and sync data
            automatically when back online.
          </p>
        </div>

        {/* Features list */}
        <div className="relative z-10 space-y-4">
          {features.map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 text-sm text-gray-300 group"
            >
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                {f.icon}
              </span>
              <span className="group-hover:text-white transition-colors duration-300">
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 relative">
        <button className='bg-red-600 text-white px-3 py-2 rounded-xl cursor-pointer absolute top-[3%] right-[3%] '
        onClick={subscribeUser}
        >
          Notification
        </button>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-15 h-15 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <img src={logoImage} alt='logo image' />
            </div>
            <div>
              <span className="font-bold text-xl tracking-wide text-gray-900">
                EVENT APP
              </span>
              <p className="text-xs text-gray-500 -mt-0.5">Customer Management</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-7 sm:p-9">
            {/* Header */}
            <div className="mb-7">
              <h2 className="font-bold text-2xl text-gray-900 mb-1.5">
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="w-4.5 h-4.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 focus:bg-white hover:border-gray-300"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="w-4.5 h-4.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 focus:bg-white hover:border-gray-300"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.11 6.11m3.768 3.768l4.242 4.242m0 0l3.768 3.768M6.11 6.11L3 3m3.11 3.11l4.242 4.242"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-black text-white font-semibold text-sm rounded-xl shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-xl hover:shadow-black/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-black disabled:active:scale-100 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-4 h-4 -mr-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider + hint */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-gray-500">
                  Default credentials:{' '}
                  <code className="font-mono font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                    admin2
                  </code>{' '}
                  /{' '}
                  <code className="font-mono font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                    1234
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Fist-o Event App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}