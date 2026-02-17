/**
 * ID Verification Component
 * 
 * Allows staff to upload ID documents for verification using Didit API.
 * Displays verification status and extracted information.
 */

'use client';

import { useState } from 'react';

interface IDVerificationProps {
  staffId: string;
  onVerificationComplete?: (data: any) => void;
}

export default function IDVerification({ staffId, onVerificationComplete }: IDVerificationProps) {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Handle front image selection
  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Handle back image selection
  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Submit verification request
  const handleVerify = async () => {
    if (!frontImage) {
      setError('Please upload the front of your ID document');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      // Build form data
      const formData = new FormData();
      formData.append('front_image', frontImage);
      if (backImage) {
        formData.append('back_image', backImage);
      }
      formData.append('staff_id', staffId);
      formData.append('minimum_age', '18');

      // Send to API
      const response = await fetch('/api/verify-id', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationResult(data.verification);
      
      // Notify parent component
      if (onVerificationComplete) {
        onVerificationComplete(data.verification);
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">ID Verification</h2>
        <p className="text-gray-600">
          Upload a clear photo of your ID document (passport, driver's license, or national ID card).
          Make sure all text is readable and the photo is not blurry.
        </p>
      </div>

      {/* Front Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Front of ID Document <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFrontImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {frontPreview && (
          <div className="mt-4">
            <img
              src={frontPreview}
              alt="Front preview"
              className="max-w-md rounded-lg border border-gray-300"
            />
          </div>
        )}
      </div>

      {/* Back Image Upload (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Back of ID Document (if applicable)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleBackImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {backPreview && (
          <div className="mt-4">
            <img
              src={backPreview}
              alt="Back preview"
              className="max-w-md rounded-lg border border-gray-300"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={!frontImage || isVerifying}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
          hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors"
      >
        {isVerifying ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
        ) : (
          'Verify ID Document'
        )}
      </button>

      {/* Verification Result */}
      {verificationResult && (
        <div className={`border rounded-lg p-6 ${
          verificationResult.status === 'Approved' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center mb-4">
            {verificationResult.status === 'Approved' ? (
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <h3 className="text-xl font-bold">
              {verificationResult.status === 'Approved' ? 'ID Verified!' : 'Verification Status: ' + verificationResult.status}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Full Name</p>
              <p className="font-semibold">{verificationResult.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600">Date of Birth</p>
              <p className="font-semibold">{verificationResult.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-gray-600">Document Type</p>
              <p className="font-semibold">{verificationResult.documentType}</p>
            </div>
            <div>
              <p className="text-gray-600">Document Number</p>
              <p className="font-semibold">{verificationResult.documentNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Nationality</p>
              <p className="font-semibold">{verificationResult.nationality}</p>
            </div>
            <div>
              <p className="text-gray-600">Expiration Date</p>
              <p className={`font-semibold ${verificationResult.isExpired ? 'text-red-600' : ''}`}>
                {verificationResult.expirationDate}
                {verificationResult.isExpired && ' (EXPIRED)'}
              </p>
            </div>
          </div>

          {verificationResult.warnings && verificationResult.warnings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="font-semibold text-gray-700 mb-2">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {verificationResult.warnings.map((warning: any, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    {warning.short_description}: {warning.long_description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
