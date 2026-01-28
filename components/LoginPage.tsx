import React, { useState } from 'react';
import { Key, User, ArrowRight, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (name: string, key: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter a valid API Key');
      return;
    }
    if (!apiKey.startsWith('AIza')) {
       setError('This does not look like a valid Google API Key (starts with AIza...)');
       return;
    }

    onLogin(name, apiKey);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-pw-blue text-2xl font-bold text-white shadow-lg">
            PW
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-heading">
            ProofVision Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure video quality assurance for Physics Wallah
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-xl bg-white px-8 py-10 shadow-xl ring-1 ring-gray-900/5 sm:rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pl-10 py-3 text-gray-900 placeholder-gray-400 focus:border-pw-orange focus:ring-pw-orange sm:text-sm shadow-sm transition-colors"
                  placeholder="e.g. Ravi Editor"
                />
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label htmlFor="apikey" className="block text-sm font-medium text-gray-700">
                Google Gemini API Key
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="apikey"
                  name="apikey"
                  type={showKey ? "text" : "password"}
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pl-10 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:border-pw-orange focus:ring-pw-orange sm:text-sm shadow-sm transition-colors"
                  placeholder="AIzaSy..."
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                 <Lock size={12} className="mr-1" />
                 Key is stored locally in your browser
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-lg bg-pw-blue px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pw-orange focus:ring-offset-2"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <ShieldCheck className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
                </span>
                Secure Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
             Get an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-pw-orange hover:underline">Google AI Studio</a>
          </div>
        </div>
      </div>
    </div>
  );
};
