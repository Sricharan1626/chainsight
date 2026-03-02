'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function LoginButton() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {user.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-indigo-500"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{user.displayName}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="ml-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Logout'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition drop-shadow-sm font-medium disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5"/>
      {isLoading ? 'Connecting...' : 'Login with Google'}
    </button>
  );
}
