import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, User, KeyRound, Loader2 } from 'lucide-react';
import { loginToSite } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

export default function Login() {
  const currentSite = useSettingsStore((state) => state.apiSettings.baseUrl);
  const [siteUrl, setSiteUrl] = useState(currentSite || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginToSite(siteUrl, username, password);
      setUser({
        name: username,
        full_name: response.message.user.full_name,
        email: response.message.user.email || username,
      });
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="cohenix-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="https://cohenix.com/favicon2.png" alt="Cohenix" className="h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Cohenix</h2>
          <p className="text-gray-600 mt-2">Sign in with your site, email and password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site URL</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="cohenix-input pl-10" placeholder="https://your-site.frappe.cloud" disabled={isLoading} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email / Username</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="cohenix-input pl-10" placeholder="Enter your email or username" disabled={isLoading} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="cohenix-input pl-10" placeholder="Enter your password" disabled={isLoading} required />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button type="submit" disabled={isLoading} className="cohenix-button w-full justify-center py-3">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
