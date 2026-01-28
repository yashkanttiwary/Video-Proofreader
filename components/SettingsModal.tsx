import React, { useState, useEffect } from 'react';
import { X, Save, User, Key, Youtube, Instagram, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  currentKey: string;
  onSave: (name: string, key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  currentKey, 
  onSave 
}) => {
  const [name, setName] = useState(currentUser);
  const [apiKey, setApiKey] = useState(currentKey);
  const [ytUrl, setYtUrl] = useState('');
  const [instaUrl, setInstaUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load defaults on open
  useEffect(() => {
    if (isOpen) {
      setName(currentUser);
      setApiKey(currentKey);
      setYtUrl(localStorage.getItem('pw_default_youtube_url') || '');
      setInstaUrl(localStorage.getItem('pw_default_instagram_url') || '');
    }
  }, [isOpen, currentUser, currentKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate short delay for UX
    setTimeout(() => {
      // Save global preferences
      localStorage.setItem('pw_default_youtube_url', ytUrl);
      localStorage.setItem('pw_default_instagram_url', instaUrl);
      
      // Pass auth changes back up
      onSave(name, apiKey);
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-heading text-xl font-semibold text-pw-blue">Settings & Preferences</h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Account Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Account</h4>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 py-2 text-sm focus:border-pw-orange focus:ring-1 focus:ring-pw-orange outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Gemini API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 py-2 text-sm focus:border-pw-orange focus:ring-1 focus:ring-pw-orange outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Defaults Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Default Channel Links</h4>
            <p className="text-xs text-gray-500">These will automatically pre-fill when you upload a video.</p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">YouTube Channel URL</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-red-500" />
                <input 
                  type="url" 
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://youtube.com/@PhysicsWallah"
                  className="w-full rounded-lg border border-gray-300 pl-9 py-2 text-sm focus:border-pw-orange focus:ring-1 focus:ring-pw-orange outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Instagram Profile URL</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-pink-500" />
                <input 
                  type="url" 
                  value={instaUrl}
                  onChange={(e) => setInstaUrl(e.target.value)}
                  placeholder="https://instagram.com/physicswallah"
                  className="w-full rounded-lg border border-gray-300 pl-9 py-2 text-sm focus:border-pw-orange focus:ring-1 focus:ring-pw-orange outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center rounded-lg bg-pw-blue py-2.5 font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-70 transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};