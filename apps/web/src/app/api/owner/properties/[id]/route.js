import { createDuplicateGuardLog } from '@/app/api/utils/duplicate-guard-logs';
import { getPropertiesCollection, mapPropertyDoc } from '@/app/api/utils/mongo-collections';
import { requireRoles } from '@/app/api/utils/session';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getPropertyById(id) {
  const properties = await getPropertiesCollection();
  return properties.findOne({ id });
}

export async function GET(request, { params }) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const propertyId = toNumber(params.id);
  if (!propertyId) {
    return Response.json({ error: 'Invalid property id' }, { status: 400 });
  }

  try {
    const property = await getPropertyById(propertyId);
    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const sessionUserId = auth.session.userId ? Number(auth.session.userId) : null;
    const isOwner = sessionUserId && Number(property.owner_id) === sessionUserId;
    if (auth.session.role === 'owner' && !isOwner) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json(mapPropertyDoc(property));
  } catch (error) {
    console.error('Error fetching owner property:', error);
    return Response.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const propertyId = toNumber(params.id);
  if (!propertyId) {
    return Response.json({ error: 'Invalid property id' }, { status: 400 });
  }

  try {
    const property = await getPropertyById(propertyId);
    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const sessionUserId = auth.session.userId ? Number(auth.session.userId) : null;
    const isOwner = sessionUserId && Number(property.owner_id) === sessionUserId;
    if (auth.session.role === 'owner' && !isOwner) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const sharing = payload.sharing ?? property.sharing;
    const normalizedSharing = String(sharing || '').toLowerCase();
    const validSharingValues = new Set(['1', '2', '3', 'all123']);
    if (!validSharingValues.has(normalizedSharing)) {
      return Response.json({ error: 'Invalid sharing value' }, { status: 400 });
    }
    const requiredPriceKeys =
      normalizedSharing === 'all123' ? ['1', '2', '3'] : [normalizedSharing];

    const set = {
      title: payload.title ?? property.title,
      city: payload.city ?? property.city,
      area: payload.area ?? property.area,
      price: Number(payload.price ?? property.price),
      available_rooms: Number(
        payload.availableRooms ?? payload.available_rooms ?? property.available_rooms
      ),
      gender_allowed: payload.genderAllowed ?? payload.gender_allowed ?? property.gender_allowed,
      sharing: normalizedSharing,
      food_option: payload.foodOption ?? payload.food_option ?? property.food_option,
      amenities: Array.isArray(payload.amenities) ? payload.amenities : property.amenities,
      images: Array.isArray(payload.images) ? payload.images : property.images,
      description: payload.description ?? property.description,
      updated_at: new Date().toISOString(),
    };

    const nextLicenseNumber = String(
      payload.propertyLicenseNumber ??
        payload.property_license_number ??
        property.property_license_number ??
        ''
    ).trim();
    const nextLicenseDocumentUrl = String(
      payload.propertyLicenseDocumentUrl ??
        payload.property_license_document_url ??
        property.property_license_document_url ??
        ''
    ).trim();
    const normalizedTitle = normalizeKey(set.title);
    const normalizedCity = normalizeKey(set.city);
    const normalizedArea = normalizeKey(set.area);
    set.property_license_number = nextLicenseNumber;
    set.property_license_document_url = nextLicenseDocumentUrl;
    set.normalized_title = normalizedTitle;
    set.normalized_city = normalizedCity;
    set.normalized_area = normalizedArea;

    const properties = await getPropertiesCollection();
    if (nextLicenseNumber) {
      const duplicateByLicense = await properties.findOne({
        id: { $ne: propertyId },
        property_license_number: nextLicenseNumber,
        owner_id: { $ne: Number(property.owner_id) },
      });
      if (duplicateByLicense) {
        await createDuplicateGuardLog({
          entityType: 'property',
          reasonCode: 'property_license_exists',
          message:
            'Property update blocked because license number is already linked with another owner.',
          actorRole: auth.session.role,
          actorId: Number(property.owner_id),
          attempted: {
            propertyId,
            title: set.title,
            city: set.city,
            area: set.area,
            propertyLicenseNumber: nextLicenseNumber,
          },
          conflict: {
            propertyId: Number(duplicateByLicense.id),
            ownerId: Number(duplicateByLicense.owner_id),
          },
          endpoint: '/api/owner/properties/[id]:PATCH',
        });
        return Response.json(
          { error: 'This property license number is already linked with another owner.' },
          { status: 409 }
        );
      }
    }

    const duplicateByLocation = await properties.findOne({
      id: { $ne: propertyId },
      owner_id: { $ne: Number(property.owner_id) },
      $or: [
        {
          normalized_title: normalizedTitle,
          normalized_city: normalizedCity,
          normalized_area: normalizedArea,
        },
        {
          title: { $regex: `^${escapeRegex(set.title)}$`, $options: 'i' },
          city: { $regex: `^${escapeRegex(set.city)}$`, $options: 'i' },
          area: { $regex: `^${escapeRegex(set.area)}$`, $options: 'i' },
        },
      ],
    });
    if (duplicateByLocation) {
      await createDuplicateGuardLog({
        entityType: 'property',
        reasonCode: 'property_location_exists',
        message:
          'Property update blocked because a similar listing already exists under another owner.',
        actorRole: auth.session.role,
        actorId: Number(property.owner_id),
        attempted: {
          propertyId,
          title: set.title,
          city: set.city,
          area: set.area,
        },
        conflict: {
          propertyId: Number(duplicateByLocation.id),
          ownerId: Number(duplicateByLocation.owner_id),
          title: duplicateByLocation.title,
          city: duplicateByLocation.city,
          area: duplicateByLocation.area,
        },
        endpoint: '/api/owner/properties/[id]:PATCH',
      });
      return Response.json(
        {
          error:
            'Similar property already exists under another owner. Duplicate listings are not allowed.',
        },
        { status: 409 }
      );
    }

    const incomingSharingPrices =
      payload.sharingPrices || payload.sharing_prices || property.sharing_prices || {};
    if (incomingSharingPrices && typeof incomingSharingPrices === 'object') {
      const nextSharingPrices = {};
      for (const key of ['1', '2', '3']) {
        const parsed = toPositiveNumber(incomingSharingPrices[key]);
        if (parsed) nextSharingPrices[key] = parsed;
      }
      for (const key of requiredPriceKeys) {
        const value = nextSharingPrices[key];
        if (!Number.isFinite(value) || value <= 0) {
          return Response.json(
            { error: `Valid sharing price is required for ${key}-sharing` },
            { status: 400 }
          );
        }
      }
      set.sharing_prices = nextSharingPrices;
      if (!payload.price) {
        const nextBasePrice = Math.min(
          ...requiredPriceKeys.map((key) => Number(nextSharingPrices[key]))
        );
        set.price = Number(nextBasePrice);
      }
    }

    if (!Number.isFinite(set.price) || set.price < 0) {
      return Response.json({ error: 'Invalid price' }, { status: 400 });
    }

    if (!Number.isFinite(set.available_rooms) || set.available_rooms < 0) {
      return Response.json({ error: 'Invalid available rooms' }, { status: 400 });
    }

    if (auth.session.role === 'owner') {
      const contentEditKeys = [
        'title',
        'city',
        'area',
        'price',
        'genderAllowed',
        'gender_allowed',
        'sharing',
        'foodOption',
        'food_option',
        'amenities',
        'images',
        'description',
        'sharingPrices',
        'sharing_prices',
      ];
      const hasContentEdits = contentEditKeys.some((key) => payload[key] !== undefined);

      if (hasContentEdits) {
        // Content edits require fresh admin review.
        set.is_approved = false;
        set.listing_status = 'under_review';
        set.rejection_reason = '';
      }
    }

    const updated = await properties.findOneAndUpdate(
      { id: propertyId },
      { $set: set },
      { returnDocument: 'after' }
    );

    const doc = updated?.value || updated;
    return Response.json(mapPropertyDoc(doc));
  } catch (error) {
    console.error('Error updating owner property:', error);
    return Response.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const propertyId = toNumber(params.id);
  if (!propertyId) {
    return Response.json({ error: 'Invalid property id' }, { status: 400 });
  }

  try {
    const property = await getPropertyById(propertyId);
    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const sessionUserId = auth.session.userId ? Number(auth.session.userId) : null;
    const isOwner = sessionUserId && Number(property.owner_id) === sessionUserId;
    if (auth.session.role === 'owner' && !isOwner) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const properties = await getPropertiesCollection();
    await properties.deleteOne({ id: propertyId });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting owner property:', error);
    return Response.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
