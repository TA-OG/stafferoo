/**
 * API Route: POST /api/verify-id
 * 
 * Handles ID verification requests from the frontend.
 * Accepts document images and returns verification results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIDDocument, extractVerificationData } from '@/app/lib/didit';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    
    const frontImage = formData.get('front_image') as File;
    const backImage = formData.get('back_image') as File | null;
    const staffId = formData.get('staff_id') as string;
    const minimumAge = formData.get('minimum_age') as string | null;

    // Validate required fields
    if (!frontImage) {
      return NextResponse.json(
        { error: 'Front image is required' },
        { status: 400 }
      );
    }

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Verify ID document with Didit
    const verificationResponse = await verifyIDDocument({
      frontImage,
      backImage: backImage || undefined,
      performDocumentLiveness: true, // Enable liveness detection
      minimumAge: minimumAge ? parseInt(minimumAge) : 18, // Default 18
      vendorData: staffId, // Track by staff ID
      expirationDateNotDetectedAction: 'DECLINE',
      invalidMrzAction: 'DECLINE',
      inconsistentDataAction: 'DECLINE',
      preferredCharacters: 'latin',
      saveApiRequest: true, // Save for manual review if needed
    });

    // Extract simplified data
    const verificationData = extractVerificationData(verificationResponse);

    // Store verification result in id_verifications table
    const { error: verificationError } = await supabase
      .from('id_verifications')
      .insert({
        staff_id: staffId,
        provider: 'didit',
        provider_reference: verificationResponse.request_id,
        status: verificationData.status.toLowerCase(),
        payload: verificationResponse,
      });

    if (verificationError) {
      console.error('Database insert error:', verificationError);
      throw new Error('Failed to save verification result');
    }

    // Update staff profile with verified name if approved
    if (verificationData.status === 'Approved') {
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .update({
          full_name: verificationData.fullName,
        })
        .eq('id', staffId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }

    // Return verification result
    return NextResponse.json({
      success: true,
      verification: verificationData,
      request_id: verificationResponse.request_id,
    });

  } catch (error) {
    console.error('ID verification error:', error);
    
    return NextResponse.json(
      {
        error: 'ID verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
