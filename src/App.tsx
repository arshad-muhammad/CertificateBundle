import React, { useState } from 'react';
import SearchPage from './components/SearchPage';
import AdminPage from './components/AdminPage';
import { Settings, Search as SearchIcon } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'search' | 'admin'>('search');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setView('search')}>
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <SearchIcon className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">CertiFind</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setView(view === 'search' ? 'admin' : 'search')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {view === 'search' ? (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Portal
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search Certificates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        {view === 'search' ? <SearchPage /> : <AdminPage />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} CertiFind. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
