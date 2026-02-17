/**
 * Didit ID Verification API Client
 * 
 * This module handles ID verification using Didit's API.
 * It submits document images and returns structured verification results.
 */

const DIDIT_API_URL = 'https://verification.didit.me/v3/id-verification/';
const DIDIT_API_KEY = process.env.DIDIT_API_KEY;

/**
 * Verification status returned by Didit
 */
export type VerificationStatus = 'Approved' | 'Declined' | 'Pending' | 'Manual Review';

/**
 * ID Verification Request Parameters
 */
export interface IDVerificationRequest {
  frontImage: File | Blob;
  backImage?: File | Blob;
  performDocumentLiveness?: boolean;
  minimumAge?: number; // 1-120
  vendorData?: string; // User identifier (email, UUID, etc.)
  expirationDateNotDetectedAction?: 'DECLINE' | 'NO_ACTION';
  invalidMrzAction?: 'DECLINE' | 'NO_ACTION';
  inconsistentDataAction?: 'DECLINE' | 'NO_ACTION';
  preferredCharacters?: 'latin' | 'non_latin';
  saveApiRequest?: boolean;
}

/**
 * ID Verification Response from Didit
 */
export interface IDVerificationResponse {
  request_id: string;
  id_verification: {
    status: VerificationStatus;
    issuing_state: string;
    issuing_state_name: string;
    document_type: string;
    document_number: string;
    personal_number?: string;
    date_of_birth: string;
    age: number;
    expiration_date: string;
    date_of_issue: string;
    first_name: string;
    last_name: string;
    full_name: string;
    gender: string;
    address?: string;
    formatted_address?: string;
    place_of_birth?: string;
    nationality: string;
    portrait_image: string; // Base64 encoded
    front_document_image: string; // Base64 encoded
    back_document_image?: string; // Base64 encoded
    mrz?: {
      surname: string;
      name: string;
      country: string;
      nationality: string;
      birth_date: string;
      expiry_date: string;
      sex: string;
      document_type: string;
      document_number: string;
      warnings: string[];
      errors: string[];
    };
    warnings: Array<{
      risk: string;
      log_type: string;
      short_description: string;
      long_description: string;
    }>;
  };
  created_at: string;
}

/**
 * Verify an ID document using Didit API
 * 
 * @param request - ID verification request parameters
 * @returns Verification response with extracted document data
 * @throws Error if API key is not configured or request fails
 */
export async function verifyIDDocument(
  request: IDVerificationRequest
): Promise<IDVerificationResponse> {
  // Validate API key
  if (!DIDIT_API_KEY) {
    throw new Error('DIDIT_API_KEY is not configured in environment variables');
  }

  // Build FormData for multipart/form-data request
  const formData = new FormData();
  
  // Required fields
  formData.append('front_image', request.frontImage);
  
  // Optional fields
  if (request.backImage) {
    formData.append('back_image', request.backImage);
  }
  
  if (request.performDocumentLiveness !== undefined) {
    formData.append('perform_document_liveness', String(request.performDocumentLiveness));
  }
  
  if (request.minimumAge) {
    if (request.minimumAge < 1 || request.minimumAge > 120) {
      throw new Error('minimumAge must be between 1 and 120');
    }
    formData.append('minimum_age', String(request.minimumAge));
  }
  
  if (request.vendorData) {
    formData.append('vendor_data', request.vendorData);
  }
  
  if (request.expirationDateNotDetectedAction) {
    formData.append('expiration_date_not_detected_action', request.expirationDateNotDetectedAction);
  }
  
  if (request.invalidMrzAction) {
    formData.append('invalid_mrz_action', request.invalidMrzAction);
  }
  
  if (request.inconsistentDataAction) {
    formData.append('inconsistent_data_action', request.inconsistentDataAction);
  }
  
  if (request.preferredCharacters) {
    formData.append('preferred_characters', request.preferredCharacters);
  }
  
  if (request.saveApiRequest !== undefined) {
    formData.append('save_api_request', String(request.saveApiRequest));
  }

  try {
    // Make API request
    const response = await fetch(DIDIT_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': DIDIT_API_KEY,
      },
      body: formData,
    });

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Didit API error (${response.status}): ${errorText}`);
    }

    // Parse and return response
    const data: IDVerificationResponse = await response.json();
    return data;

  } catch (error) {
    console.error('ID verification failed:', error);
    throw error;
  }
}

/**
 * Check if verification was successful
 * 
 * @param response - Verification response from Didit
 * @returns true if approved, false otherwise
 */
export function isVerificationApproved(response: IDVerificationResponse): boolean {
  return response.id_verification.status === 'Approved';
}

/**
 * Extract key information from verification response
 * 
 * @param response - Verification response from Didit
 * @returns Simplified verification data
 */
export function extractVerificationData(response: IDVerificationResponse) {
  const { id_verification } = response;
  
  return {
    status: id_verification.status,
    fullName: id_verification.full_name,
    firstName: id_verification.first_name,
    lastName: id_verification.last_name,
    dateOfBirth: id_verification.date_of_birth,
    age: id_verification.age,
    documentNumber: id_verification.document_number,
    documentType: id_verification.document_type,
    expirationDate: id_verification.expiration_date,
    nationality: id_verification.nationality,
    gender: id_verification.gender,
    address: id_verification.formatted_address || id_verification.address,
    portraitImage: id_verification.portrait_image,
    warnings: id_verification.warnings,
    isExpired: id_verification.warnings.some(w => w.risk === 'DOCUMENT_EXPIRED'),
  };
}
