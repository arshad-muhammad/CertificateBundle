import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setStatus({ type: 'error', message: 'Please select a valid PDF file.' });
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Successfully processed ${data.totalPages} certificates. The system is ready for users.` 
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to upload and process PDF.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An error occurred during upload. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Upload the master certificate PDF to build the search index.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Master PDF Upload</h2>
        </div>
        
        <div className="p-8">
          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              id="pdf-upload"
            />
            
            {!file ? (
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="text-slate-700 font-medium text-lg">Click to select master PDF</span>
                <span className="text-slate-500 text-sm mt-1">Only .pdf files are supported</span>
              </label>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <File className="w-8 h-8" />
                </div>
                <span className="text-indigo-900 font-medium text-lg">{file.name}</span>
                <span className="text-indigo-600 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline"
                  disabled={loading}
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload and Process
                </>
              )}
            </button>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl flex items-start ${
                status.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
              )}
              <p>{status.message}</p>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-blue-800 font-semibold mb-2">How it works</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
          <li>Upload a single PDF containing all certificates (one per page).</li>
          <li>The system will extract text from each page to build a search index.</li>
          <li>Users can then search for their name to download their specific page.</li>
          <li>For best results, ensure the PDF contains selectable text (not just images).</li>
        </ul>
      </div>
    </div>
  );
}
