'use client';

import { useState } from 'react';

interface FileUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function FileUploadModal({ onClose, onSuccess }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    message: string;
    imported: number;
    errors?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError('Please select a CSV or XLSX file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/employees/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (result) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upload Employee File
          </h2>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Upload a CSV or XLSX file containing employee information. The file must include
              columns for First Name and Last Name. All other columns are optional.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">File Format Requirements:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Required columns: First Name, Last Name</li>
                <li>• Optional columns: Middle Name, Employee ID, Hire Date, Employment Type, Phone, Email, Status</li>
                <li>• First row should contain column headers</li>
                <li>• Employment Type values: &quot;Hourly&quot;, &quot;Salary&quot;, &quot;Contract&quot;, &quot;Part-Time&quot;</li>
                <li>• Status values: &quot;active&quot; or &quot;inactive&quot; (defaults to active)</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-semibold mb-2">{result.message}</p>
              <p>Successfully imported: {result.imported} employees</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold mb-1">Errors:</p>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
