import React, { lazy, Suspense } from 'react';
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { registerServiceWorker } from "./pushNotifications";


const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerRegistration = lazy(() => import('./pages/CustomerRegistration'));
const Reports = lazy(() => import('./pages/Reports'));
const MasterPage = lazy(() => import('./pages/MasterPage'));
const EmployeePage = lazy(() => import('./pages/EmployeePage'));
const FollowupMainPage = lazy(() => import('./pages/FollowupMainPage'));
const FollowupPage = lazy(() => import('./pages/FollowupPage'));
const AdminFollowupPage = lazy(() => import('./pages/AdminFollowupPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-xs font-mono text-ink-400">Loading...</p>
    </div>
  </div>
);


export default function App() {
  useEffect(() => {
     registerServiceWorker();
   }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers/register" element={<CustomerRegistration />} />
                <Route path="reports" element={<Reports />} />
                <Route
                  path="master"
                  element={
                    <ProtectedRoute adminOnly>
                      <MasterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="employees"
                  element={
                    <ProtectedRoute adminOnly>
                      <EmployeePage />
                    </ProtectedRoute>
                  }
                />

              <Route path="followup"     element={<FollowupMainPage />} />
              <Route path="followup/:id" element={<FollowupPage />} />
                <Route
                path="admin/followup"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminFollowupPage />
                  </ProtectedRoute>
                }
              />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            

            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
