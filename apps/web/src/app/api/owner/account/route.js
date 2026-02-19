import {
  getOwnerById,
  updateOwnerProfile,
  updateOwnerVerificationSubmission,
} from '@/app/api/utils/owner-auth-db';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const owner = await getOwnerById(auth.session.userId);

    if (!owner) {
      return Response.json({ error: 'Owner account not found' }, { status: 404 });
    }

    return Response.json({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      mobile: owner.mobile,
      verificationStatus: owner.verificationStatus || 'not_submitted',
      verificationRejectionReason: owner.verificationRejectionReason || '',
      govtIdType: owner.govtIdType || '',
      govtIdUrl: owner.govtIdUrl || '',
      govtIdNumber: owner.govtIdNumber || '',
      govtIdUploadedAt: owner.govtIdUploadedAt || null,
      govtIdVerifiedAt: owner.govtIdVerifiedAt || null,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt || owner.createdAt,
    });
  } catch (error) {
    console.error('Failed to fetch owner account:', error);
    return Response.json({ error: 'Failed to fetch owner account' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const name = String(payload.name || '').trim();
    const mobile = String(payload.mobile || '').trim();
    const govtIdType = String(payload.govtIdType || '').trim();
    const govtIdUrl = String(payload.govtIdUrl || '').trim();
    const govtIdNumber = String(payload.govtIdNumber || '').trim();

    if (!name || !mobile) {
      return Response.json({ error: 'Name and mobile are required' }, { status: 400 });
    }

    if (!/^[0-9]{10,15}$/.test(mobile)) {
      return Response.json({ error: 'Please enter a valid mobile number' }, { status: 400 });
    }

    const owner = await getOwnerById(auth.session.userId);
    if (!owner) {
      return Response.json({ error: 'Owner account not found' }, { status: 404 });
    }
    const verificationStatus = String(owner.verificationStatus || 'not_submitted').toLowerCase();

    const updated = await updateOwnerProfile({
      ownerId: owner.id,
      name,
      mobile,
    });

    if (!updated.ok) {
      return Response.json(
        { error: updated.error },
        { status: updated.error?.toLowerCase?.().includes('already linked') ? 409 : 400 }
      );
    }

    let ownerRecord = updated.owner;
    const wantsVerificationSubmit = Boolean(govtIdType || govtIdUrl || govtIdNumber);
    if (wantsVerificationSubmit) {
      if (verificationStatus === 'approved') {
        return Response.json(
          { error: 'Owner verification is already approved. Document update is disabled.' },
          { status: 403 }
        );
      }
      if (verificationStatus === 'pending') {
        return Response.json(
          {
            error:
              'Verification is under review. You can update documents only after admin review.',
          },
          { status: 409 }
        );
      }
      if (!govtIdType || !govtIdUrl || !govtIdNumber) {
        return Response.json(
          {
            error:
              'Document type, document number, and uploaded file are required for verification submission',
          },
          { status: 400 }
        );
      }
      const verificationUpdated = await updateOwnerVerificationSubmission({
        ownerId: owner.id,
        govtIdType,
        govtIdUrl,
        govtIdNumber,
      });
      if (!verificationUpdated.ok) {
        return Response.json({ error: verificationUpdated.error }, { status: 400 });
      }
      ownerRecord = verificationUpdated.owner;
    }

    return Response.json({
      ok: true,
      owner: {
        id: ownerRecord.id,
        name: ownerRecord.name,
        email: ownerRecord.email,
        mobile: ownerRecord.mobile,
        verificationStatus: ownerRecord.verificationStatus,
        verificationRejectionReason: ownerRecord.verificationRejectionReason,
        govtIdType: ownerRecord.govtIdType,
        govtIdUrl: ownerRecord.govtIdUrl,
        govtIdNumber: ownerRecord.govtIdNumber,
        govtIdUploadedAt: ownerRecord.govtIdUploadedAt,
        govtIdVerifiedAt: ownerRecord.govtIdVerifiedAt,
        updatedAt: ownerRecord.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update owner account:', error);
    return Response.json({ error: 'Failed to update owner account' }, { status: 500 });
  }
}
