import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, KeyRound, Loader2, X, Check } from 'lucide-react';
import { login, testConnection } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { apiSettings, setApiSettings } = useSettingsStore();

  const [newSettings, setNewSettings] = useState({
    baseUrl: apiSettings.baseUrl,
    apiKey: apiSettings.apiKey,
    apiSecret: apiSettings.apiSecret,
    useTokenAuth: apiSettings.useTokenAuth,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(username, password);
      setUser({
        name: username,
        full_name: response.message.user.full_name,
        email: response.message.user.email || username,
      });
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('none');

    try {
      await testConnection(newSettings);
      setConnectionStatus('success');
      toast.success('Connection successful!');
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof Error && error.message === 'CORS_BLOCKED') {
        toast.error('Connection blocked by CORS. Add https://stockmanagerx.netlify.app to your Frappe allowed origins or use a backend proxy.');
      } else {
        toast.error('Connection failed. Please check your settings.');
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveSettings = () => {
    setApiSettings(newSettings);
    setShowSettings(false);
    toast.success('Settings updated successfully');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="cohenix-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="https://cohenix.com/favicon2.png" alt="Cohenix" className="h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Cohenix</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="cohenix-input pl-10" placeholder="Enter your username" disabled={isLoading} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="cohenix-input pl-10" placeholder="Enter your password" disabled={isLoading} />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="flex space-x-4">
            <button type="submit" disabled={isLoading} className="cohenix-button flex-1 justify-center py-3">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}</button>
            <button type="button" onClick={() => setShowSettings(true)} className="cohenix-button bg-gray-500 hover:bg-gray-600 focus:ring-gray-500" aria-label="Open API settings">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </form>

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="cohenix-card w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-500"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base URL</label>
                  <input type="text" value={newSettings.baseUrl} onChange={(e) => setNewSettings({ ...newSettings, baseUrl: e.target.value })} className="cohenix-input mt-1" placeholder="https://your-frappe-site.com" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Use API Token Auth</label>
                  <input type="checkbox" checked={newSettings.useTokenAuth} onChange={(e) => setNewSettings({ ...newSettings, useTokenAuth: e.target.checked })} />
                </div>

                {newSettings.useTokenAuth && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API Key</label>
                      <input type="text" value={newSettings.apiKey} onChange={(e) => setNewSettings({ ...newSettings, apiKey: e.target.value })} className="cohenix-input mt-1" placeholder="Enter API Key" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API Secret</label>
                      <input type="password" value={newSettings.apiSecret} onChange={(e) => setNewSettings({ ...newSettings, apiSecret: e.target.value })} className="cohenix-input mt-1" placeholder="Enter API Secret" />
                    </div>
                  </>
                )}

                <p className="text-xs text-gray-500">If Token Auth is off, this app uses Frappe session login (email/username + password) and keeps you signed in on this device.</p>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className="cohenix-button flex-1 justify-center bg-gray-500 hover:bg-gray-600 focus:ring-gray-500">
                    {isTestingConnection ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Test Connection{connectionStatus === 'success' && <Check className="h-5 w-5 ml-2 text-green-400" />}{connectionStatus === 'error' && <X className="h-5 w-5 ml-2 text-red-400" />}</>}
                  </button>
                  <button type="button" onClick={handleSaveSettings} disabled={connectionStatus !== 'success'} className="cohenix-button flex-1 justify-center">Save Settings</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
