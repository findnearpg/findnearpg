import { createDuplicateGuardLog } from '@/app/api/utils/duplicate-guard-logs';
import {
  getNextSequence,
  getPropertiesCollection,
  getReviewsCollection,
  mapPropertyDoc,
  slugify,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import {
  getOwnerSubscription,
  isSubscriptionActive,
} from '@/app/api/utils/owner-subscription-store';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { getCachedValue, setCachedValue } from '@/app/api/utils/response-cache';
import { getSessionFromRequest, requireRoles } from '@/app/api/utils/session';

async function createUniqueSlug(baseSlug) {
  const properties = await getPropertiesCollection();
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const exists = await properties.findOne({ slug: candidate }, { projection: { id: 1 } });
    if (!exists) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
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

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TEXT_SYNONYMS = {
  bangalore: ['bengaluru', 'blr'],
  bengaluru: ['bangalore', 'blr'],
  blr: ['bangalore', 'bengaluru'],
  hydrabad: ['hyderabad'],
  hyderbad: ['hyderabad'],
  hyderabad: ['hydrabad', 'hyderbad'],
  bombay: ['mumbai'],
  madras: ['chennai'],
};

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function buildTokenGroups(tokens) {
  return tokens.map((token) => {
    const variants = new Set([token]);
    const aliases = TEXT_SYNONYMS[token] || [];
    for (const alias of aliases) {
      variants.add(alias);
    }
    return [...variants];
  });
}

function tokenMatches(queryToken, candidateToken) {
  if (!queryToken || !candidateToken) return false;
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;
  const maxDistance = queryToken.length <= 4 ? 1 : 2;
  return levenshteinDistance(queryToken, candidateToken) <= maxDistance;
}

function fuzzyMatch(textQuery, fields) {
  const normalizedQuery = normalizeSearchText(textQuery);
  if (!normalizedQuery) return true;

  const baseTokens = normalizedQuery.split(' ').filter(Boolean);
  const queryTokenGroups = buildTokenGroups(baseTokens);
  const candidateTokens = normalizeSearchText(fields.join(' ')).split(' ').filter(Boolean);

  return queryTokenGroups.every((tokenGroup) =>
    tokenGroup.some((token) => candidateTokens.some((candidate) => tokenMatches(token, candidate)))
  );
}

export async function GET(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'properties:list',
    limit: Number(process.env.PROPERTIES_LIST_RATE_LIMIT || 6000),
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const area = searchParams.get('area');
  const gender = searchParams.get('gender');
  const amenities = searchParams.get('amenities');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const ownerId = searchParams.get('ownerId');
  const approved = searchParams.get('approved');
  const savedOnly = searchParams.get('saved') === 'true';
  const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const safeOffset = Math.max(0, offset);
  const hasTextQuery = Boolean(normalizeSearchText(city) || normalizeSearchText(area));
  const isPublicCacheEligible = !savedOnly;
  const cacheKey = isPublicCacheEligible
    ? `v1:${new URL(request.url).searchParams.toString()}`
    : null;

  if (cacheKey) {
    const cached = getCachedValue('properties:list', cacheKey);
    if (cached) {
      return Response.json(cached);
    }
  }

  try {
    const query = {};
    let savedPropertyIds = [];

    if (approved === 'false') {
      query.is_approved = false;
    } else if (approved !== 'all') {
      query.is_approved = true;
    }

    if (gender) query.gender_allowed = gender;

    if (amenities) {
      const splitAmenities = amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (splitAmenities.length > 0) {
        query.amenities = { $all: splitAmenities };
      }
    }

    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min !== null || max !== null) {
      query.price = {};
      if (min !== null) query.price.$gte = min;
      if (max !== null) query.price.$lte = max;
    }

    const ownerIdNum = toNumber(ownerId);
    if (ownerIdNum !== null) query.owner_id = ownerIdNum;

    if (savedOnly) {
      const session = await getSessionFromRequest(request);
      if (!session?.userId || String(session.role) !== 'user') {
        return Response.json(
          { error: 'Only user accounts can view saved properties' },
          { status: 403 }
        );
      }
      const userId = Number(session.userId);
      if (!Number.isFinite(userId) || userId <= 0) {
        return Response.json({ error: 'Invalid user session' }, { status: 400 });
      }

      const db = await getMongoDb();
      const savesCol = db.collection('property_saves');
      const saveDocs = await savesCol
        .find({ user_id: userId }, { projection: { _id: 0, property_id: 1, created_at: 1 } })
        .sort({ created_at: -1 })
        .toArray();

      savedPropertyIds = saveDocs.map((item) => Number(item.property_id)).filter(Number.isFinite);
      if (!savedPropertyIds.length) return Response.json([]);

      query.id = { $in: savedPropertyIds };
      query.is_approved = true;
    }

    const properties = await getPropertiesCollection();
    const dbCursor = properties.find(query).sort({ created_at: -1 });

    const docs = hasTextQuery
      ? await dbCursor.limit(Math.max(120, safeLimit * 12)).toArray()
      : await dbCursor.skip(safeOffset).limit(safeLimit).toArray();
    const mapped = docs.map(mapPropertyDoc);
    const filteredByText = hasTextQuery
      ? mapped.filter((item) => {
          const cityMatches = city ? fuzzyMatch(city, [item.city, item.area, item.title]) : true;
          const areaMatches = area ? fuzzyMatch(area, [item.area, item.city, item.title]) : true;
          return cityMatches && areaMatches;
        })
      : mapped;
    const paged = hasTextQuery
      ? filteredByText.slice(safeOffset, safeOffset + safeLimit)
      : filteredByText;
    const reorderedPaged = savedOnly
      ? paged.sort(
          (a, b) => savedPropertyIds.indexOf(Number(a.id)) - savedPropertyIds.indexOf(Number(b.id))
        )
      : paged;
    const propertyIds = reorderedPaged.map((item) => Number(item.id)).filter(Number.isFinite);

    if (!propertyIds.length) {
      return Response.json(reorderedPaged);
    }

    const reviewsCol = await getReviewsCollection();
    const reviewStats = await reviewsCol
      .aggregate([
        { $match: { property_id: { $in: propertyIds } } },
        {
          $group: {
            _id: '$property_id',
            count: { $sum: 1 },
            avg: { $avg: '$rating' },
          },
        },
      ])
      .toArray();
    const statMap = new Map(
      reviewStats.map((item) => [
        Number(item._id),
        { count: Number(item.count || 0), avg: Number(item.avg || 0) },
      ])
    );

    const result = reorderedPaged.map((item) => {
        const stats = statMap.get(Number(item.id));
        return {
          ...item,
          review_count: Number(stats?.count || 0),
          review_average: Number(Number(stats?.avg || 0).toFixed(1)),
        };
      });

    if (cacheKey) {
      setCachedValue('properties:list', cacheKey, result, 20_000);
    }

    return Response.json(result);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return Response.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit({
    request,
    namespace: 'properties:create',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();

    const title = String(payload.title || '').trim();
    const city = String(payload.city || '').trim();
    const area = String(payload.area || '').trim();
    const price = toNumber(payload.price);
    const sharingPricesPayload = payload.sharingPrices || payload.sharing_prices || {};
    const sharingPrices = {
      1: toNumber(sharingPricesPayload['1'] ?? sharingPricesPayload.single),
      2: toNumber(sharingPricesPayload['2'] ?? sharingPricesPayload.double),
      3: toNumber(sharingPricesPayload['3'] ?? sharingPricesPayload.triple),
    };
    const genderAllowed = String(payload.genderAllowed || payload.gender_allowed || 'co-ed').trim();
    const availableRooms = toNumber(payload.availableRooms) ?? 0;
    const foodOption = String(payload.foodOption || 'optional');
    const sharing = String(payload.sharing || '')
      .trim()
      .toLowerCase();
    const description = String(payload.description || '').trim();
    const amenities = Array.isArray(payload.amenities) ? payload.amenities : [];
    const images = Array.isArray(payload.images) ? payload.images : [];
    const ownerId = auth.session.userId ? Number(auth.session.userId) : toNumber(payload.ownerId);
    const baseSlug = slugify(payload.slug || title);
    const propertyLicenseNumber = String(payload.propertyLicenseNumber || '').trim();
    const propertyLicenseDocumentUrl = String(payload.propertyLicenseDocumentUrl || '').trim();

    const validSharingValues = new Set(['1', '2', '3', 'all123']);
    if (!title || !city || !area || !ownerId) {
      return Response.json(
        { error: 'title, city, area, and owner context are required' },
        { status: 400 }
      );
    }
    if (!validSharingValues.has(sharing)) {
      return Response.json(
        { error: 'sharing is required and must be one of: 1, 2, 3, all123' },
        { status: 400 }
      );
    }

    const requiredPriceKeys = sharing === 'all123' ? ['1', '2', '3'] : [sharing];
    for (const key of requiredPriceKeys) {
      const value = sharingPrices[key];
      if (!Number.isFinite(value) || value <= 0) {
        return Response.json(
          { error: `Valid sharing price is required for ${key}-sharing` },
          { status: 400 }
        );
      }
    }

    const allowedKeys = sharing === 'all123' ? ['1', '2', '3'] : [sharing];
    const normalizedSharingPrices = {};
    for (const key of allowedKeys) {
      const value = sharingPrices[key];
      if (Number.isFinite(value) && value > 0) {
        normalizedSharingPrices[key] = Number(value);
      }
    }
    const computedBasePrice =
      Number.isFinite(price) && price > 0
        ? Number(price)
        : Math.min(...Object.values(normalizedSharingPrices));

    const properties = await getPropertiesCollection();
    const normalizedTitle = normalizeKey(title);
    const normalizedCity = normalizeKey(city);
    const normalizedArea = normalizeKey(area);

    const duplicateByLicense = propertyLicenseNumber
      ? await properties.findOne({
          property_license_number: propertyLicenseNumber,
          owner_id: { $ne: Number(ownerId) },
        })
      : null;
    if (duplicateByLicense) {
      await createDuplicateGuardLog({
        entityType: 'property',
        reasonCode: 'property_license_exists',
        message:
          'Property create blocked because license number is already linked with another owner.',
        actorRole: auth.session.role,
        actorId: Number(ownerId),
        attempted: {
          title,
          city,
          area,
          propertyLicenseNumber,
        },
        conflict: {
          propertyId: Number(duplicateByLicense.id),
          ownerId: Number(duplicateByLicense.owner_id),
        },
        endpoint: '/api/properties:POST',
      });
      return Response.json(
        { error: 'This property license number is already linked with another owner.' },
        { status: 409 }
      );
    }

    const potentialDuplicates = await properties
      .find(
        {
          owner_id: { $ne: Number(ownerId) },
          $or: [
            {
              normalized_title: normalizedTitle,
              normalized_city: normalizedCity,
              normalized_area: normalizedArea,
            },
            {
              title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' },
              city: { $regex: `^${escapeRegex(city)}$`, $options: 'i' },
              area: { $regex: `^${escapeRegex(area)}$`, $options: 'i' },
            },
          ],
        },
        { projection: { id: 1, owner_id: 1, title: 1, city: 1, area: 1 } }
      )
      .limit(1)
      .toArray();
    if (potentialDuplicates.length > 0) {
      const firstDuplicate = potentialDuplicates[0];
      await createDuplicateGuardLog({
        entityType: 'property',
        reasonCode: 'property_location_exists',
        message:
          'Property create blocked because a similar listing already exists under another owner.',
        actorRole: auth.session.role,
        actorId: Number(ownerId),
        attempted: { title, city, area },
        conflict: {
          propertyId: Number(firstDuplicate.id),
          ownerId: Number(firstDuplicate.owner_id),
          title: firstDuplicate.title,
          city: firstDuplicate.city,
          area: firstDuplicate.area,
        },
        endpoint: '/api/properties:POST',
      });
      return Response.json(
        {
          error:
            'Similar property already exists under another owner. Duplicate listings are not allowed.',
        },
        { status: 409 }
      );
    }

    if (auth.session.role === 'owner') {
      const owner = await getOwnerById(ownerId);
      if (!owner) {
        return Response.json({ error: 'Owner account not found' }, { status: 404 });
      }
      if (String(owner.verificationStatus || '').toLowerCase() !== 'approved') {
        return Response.json(
          {
            error: 'Owner verification pending. Upload government ID and wait for admin approval.',
          },
          { status: 403 }
        );
      }
      if (!propertyLicenseNumber || !propertyLicenseDocumentUrl) {
        return Response.json(
          { error: 'Property license number and license document are required.' },
          { status: 400 }
        );
      }
      const currentPropertyCount = await properties.countDocuments({ owner_id: Number(ownerId) });
      const subscription = await getOwnerSubscription(ownerId);
      const hasActiveSubscription = isSubscriptionActive(subscription);
      const freePropertyLimit = Number(subscription?.freePropertyLimit ?? 1);
      const maxPropertyLimit = hasActiveSubscription
        ? Number(subscription?.propertyLimit ?? freePropertyLimit)
        : freePropertyLimit;
      if (currentPropertyCount >= maxPropertyLimit) {
        return Response.json(
          {
            error: hasActiveSubscription
              ? 'Your current plan property limit is reached. Upgrade subscription to add more properties.'
              : 'Free property quota used. Activate subscription to add more properties.',
            redirectTo: '/dashboard/owner/subscription',
          },
          { status: 402 }
        );
      }
    }

    const id = await getNextSequence('properties');
    const slug = await createUniqueSlug(baseSlug || `property-${id}`);
    const now = new Date().toISOString();

    const isApproved = auth.session.role === 'admin';
    const document = {
      id,
      owner_id: Number(ownerId),
      title,
      city,
      area,
      price: Number(computedBasePrice),
      sharing_prices: normalizedSharingPrices,
      amenities,
      gender_allowed: genderAllowed,
      sharing,
      images,
      is_approved: isApproved,
      listing_status: isApproved ? 'live' : 'under_review',
      legal_verification_status: isApproved ? 'approved' : 'pending',
      property_license_number: propertyLicenseNumber || '',
      property_license_document_url: propertyLicenseDocumentUrl || '',
      normalized_title: normalizedTitle,
      normalized_city: normalizedCity,
      normalized_area: normalizedArea,
      available_rooms: Number(availableRooms),
      slug,
      food_option: foodOption,
      description,
      created_at: now,
      updated_at: now,
    };

    await properties.insertOne(document);

    return Response.json(mapPropertyDoc(document), { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return Response.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
