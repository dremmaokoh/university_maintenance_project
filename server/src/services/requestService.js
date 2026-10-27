const Request = require('../models/Request');
const Assignment = require('../models/Assignment');
const StatusUpdate = require('../models/StatusUpdate');
const RequestComment = require('../models/RequestComment');
const { isVisibleToRequester, filterCommentsForUser } = require('../utils/commentVisibility');
const Category = require('../models/Category');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { ROLES, STATUSES, ALLOWED_TRANSITIONS } = require('../constants');
const { formatResolutionDuration } = require('../utils/formatResolution');

function toPublicRequest(request) {
  const effectiveCompletedAt =
    request.completedAt ||
    (request.status === STATUSES.COMPLETED ? request.updatedAt : null);
  const resolutionDuration = formatResolutionDuration(request.createdAt, effectiveCompletedAt);
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    location: request.location,
    status: request.status,
    category: request.category
      ? {
          id: request.category.id || request.category._id,
          name: request.category.name
        }
      : null,
    requester: request.requester
      ? {
          id: request.requester.id || request.requester._id,
          fullName: request.requester.fullName,
          email: request.requester.email
        }
      : null,
    assignedOfficer: request.assignedOfficer
      ? {
          id: request.assignedOfficer.id || request.assignedOfficer._id,
          fullName: request.assignedOfficer.fullName,
          email: request.assignedOfficer.email
        }
      : null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    completedAt: request.completedAt,
    officerRating: request.officerRating ?? null,
    ratedAt: request.ratedAt ?? null,
    resolutionDuration
  };
}

function toPublicStatusUpdate(update) {
  return {
    id: update.id,
    status: update.status,
    note: update.note,
    actor: update.actor
      ? {
          id: update.actor.id || update.actor._id,
          fullName: update.actor.fullName,
          role: update.actor.role
        }
      : null,
    createdAt: update.createdAt
  };
}

function buildVisibilityFilter(user) {
  const filter = { organisation: user.organisationId };

  if (user.role === ROLES.ADMIN) {
    return filter;
  }
  if (user.role === ROLES.OFFICER) {
    return { ...filter, assignedOfficer: user.id };
  }
  return { ...filter, requester: user.id };
}

function assertSameOrganisation(user, request) {
  if (!request || String(request.organisation) !== String(user.organisationId)) {
    throw new HttpError(404, 'Request not found.');
  }
}

async function listRequests(user, query) {
  const filter = buildVisibilityFilter(user);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
      { location: new RegExp(query.search, 'i') }
    ];
  }

  const [items, total] = await Promise.all([
    Request.find(filter)
      .populate('category', 'name')
      .populate('requester', 'fullName email role')
      .populate('assignedOfficer', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(filter)
  ]);

  return {
    items: items.map(toPublicRequest),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  };
}

async function getRequestById(user, id) {
  const request = await Request.findById(id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  assertSameOrganisation(user, request);

  const isOwner = request.requester && String(request.requester.id) === user.id;
  const isAssigned =
    request.assignedOfficer && String(request.assignedOfficer.id) === user.id;

  if (user.role === ROLES.STUDENT && !isOwner) {
    throw new HttpError(403, 'You can only view your own requests.');
  }
  if (user.role === ROLES.OFFICER && !isAssigned) {
    throw new HttpError(403, 'You can only view requests assigned to you.');
  }

  return toPublicRequest(request);
}

async function createRequest(user, payload) {
  if (user.role !== ROLES.STUDENT) {
    throw new HttpError(403, 'Only students can submit requests.');
  }

  const category = await Category.findOne({
    _id: payload.categoryId,
    organisation: user.organisationId
  });
  if (!category) {
    throw new HttpError(400, 'Please choose a valid category.');
  }

  const request = await Request.create({
    title: payload.title,
    description: payload.description,
    location: payload.location,
    category: category.id,
    organisation: user.organisationId,
    requester: user.id,
    status: STATUSES.PENDING
  });

  await StatusUpdate.create({
    request: request.id,
    status: STATUSES.PENDING,
    note: 'Request submitted',
    actor: user.id
  });

  const populated = await Request.findById(request.id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  return toPublicRequest(populated);
}

async function assignRequest(adminUser, requestId, officerId) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(adminUser, request);

  if (request.status !== STATUSES.PENDING) {
    throw new HttpError(
      400,
      'This request is already assigned or in progress. Cancel the current assignment before assigning again.'
    );
  }
  if (request.assignedOfficer) {
    throw new HttpError(409, 'This request already has an assigned officer.');
  }

  const officer = await User.findOne({
    _id: officerId,
    organisation: adminUser.organisationId,
    role: ROLES.OFFICER,
    isActive: true,
    accountStatus: 'active'
  });
  if (!officer) {
    throw new HttpError(400, 'Please choose an active maintenance officer from your organisation.');
  }

  request.assignedOfficer = officer.id;
  request.status = STATUSES.ASSIGNED;
  await request.save();

  await Assignment.create({
    request: request.id,
    officer: officer.id,
    assignedBy: adminUser.id
  });

  await StatusUpdate.create({
    request: request.id,
    status: STATUSES.ASSIGNED,
    note: `Assigned to ${officer.fullName}`,
    actor: adminUser.id
  });

  const populated = await Request.findById(request.id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  return toPublicRequest(populated);
}

async function unassignRequest(adminUser, requestId) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(adminUser, request);

  if (!request.assignedOfficer) {
    throw new HttpError(400, 'This request has no assigned officer.');
  }
  if (request.status !== STATUSES.ASSIGNED) {
    throw new HttpError(
      400,
      'Assignment can only be cancelled before work has started (while status is assigned).'
    );
  }

  const officer = await User.findById(request.assignedOfficer);
  const officerName = officer?.fullName || 'the officer';

  request.assignedOfficer = null;
  request.status = STATUSES.PENDING;
  await request.save();

  await StatusUpdate.create({
    request: request.id,
    status: STATUSES.PENDING,
    note: `Assignment to ${officerName} cancelled`,
    actor: adminUser.id
  });

  const populated = await Request.findById(request.id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  return toPublicRequest(populated);
}

async function listAssignments(organisationId) {
  const requestIds = await Request.find({ organisation: organisationId }).distinct('_id');
  const assignments = await Assignment.find({ request: { $in: requestIds } })
    .populate('request', 'title status')
    .populate('officer', 'fullName email')
    .populate('assignedBy', 'fullName email')
    .sort({ createdAt: -1 });

  return assignments.map((item) => ({
    id: item.id,
    request: item.request
      ? { id: item.request.id, title: item.request.title, status: item.request.status }
      : null,
    officer: item.officer
      ? { id: item.officer.id, fullName: item.officer.fullName, email: item.officer.email }
      : null,
    assignedBy: item.assignedBy
      ? { id: item.assignedBy.id, fullName: item.assignedBy.fullName }
      : null,
    createdAt: item.createdAt
  }));
}

async function updateRequestStatus(user, requestId, { status, note }) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(user, request);

  if (user.role === ROLES.OFFICER) {
    if (!request.assignedOfficer || String(request.assignedOfficer) !== user.id) {
      throw new HttpError(403, 'You can only update requests assigned to you.');
    }
  }

  const allowed = ALLOWED_TRANSITIONS[request.status] || [];
  if (!allowed.includes(status)) {
    throw new HttpError(400, `Cannot change status from ${request.status} to ${status}.`);
  }

  request.status = status;
  if (status === STATUSES.COMPLETED) {
    request.completedAt = new Date();
  }
  await request.save();

  await StatusUpdate.create({
    request: request.id,
    status,
    note: note || '',
    actor: user.id
  });

  const populated = await Request.findById(request.id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  return toPublicRequest(populated);
}

async function rateAssignedOfficer(user, requestId, stars) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(user, request);

  if (user.role !== ROLES.STUDENT) {
    throw new HttpError(403, 'Only students can rate maintenance officers.');
  }
  if (!request.requester || String(request.requester) !== user.id) {
    throw new HttpError(403, 'You can only rate your own requests.');
  }
  if (request.status !== STATUSES.COMPLETED) {
    throw new HttpError(400, 'You can rate an officer after the request is completed.');
  }
  if (!request.assignedOfficer) {
    throw new HttpError(400, 'This request has no assigned officer to rate.');
  }
  if (request.officerRating != null) {
    throw new HttpError(409, 'You have already rated this request.');
  }

  request.officerRating = stars;
  request.ratedAt = new Date();
  await request.save();

  const populated = await Request.findById(request.id)
    .populate('category', 'name')
    .populate('requester', 'fullName email role')
    .populate('assignedOfficer', 'fullName email role');

  return toPublicRequest(populated);
}

async function getRequestHistory(user, requestId) {
  await getRequestById(user, requestId);
  const history = await StatusUpdate.find({ request: requestId })
    .populate('actor', 'fullName role')
    .sort({ createdAt: 1 });
  return history.map(toPublicStatusUpdate);
}

function toPublicComment(comment) {
  return {
    id: comment.id,
    body: comment.body,
    visibleToRequester: comment.visibleToRequester,
    author: comment.author
      ? {
          id: comment.author.id || comment.author._id,
          fullName: comment.author.fullName,
          role: comment.author.role
        }
      : null,
    createdAt: comment.createdAt
  };
}

async function listRequestComments(user, requestId) {
  const request = await Request.findById(requestId).populate('requester', '_id');
  assertSameOrganisation(user, request);
  await getRequestById(user, requestId);

  const comments = await RequestComment.find({ request: requestId })
    .populate('author', 'fullName role')
    .sort({ createdAt: 1 });

  const requesterId = request.requester?.id || request.requester?._id || request.requester;
  const visible = filterCommentsForUser(comments, user, requesterId);
  return visible.map(toPublicComment);
}

async function addRequestComment(user, requestId, body) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(user, request);

  const isOwner = request.requester && String(request.requester) === user.id;
  const isAssigned =
    request.assignedOfficer && String(request.assignedOfficer) === user.id;

  if (user.role === ROLES.STUDENT && !isOwner) {
    throw new HttpError(403, 'You can only comment on your own requests.');
  }
  if (user.role === ROLES.OFFICER && !isAssigned) {
    throw new HttpError(403, 'You can only comment on requests assigned to you.');
  }

  const visibleToRequester = isVisibleToRequester(body, user.role);

  const comment = await RequestComment.create({
    request: requestId,
    author: user.id,
    body,
    visibleToRequester
  });

  const populated = await RequestComment.findById(comment.id).populate('author', 'fullName role');
  return toPublicComment(populated);
}

async function getReportSummary(organisationId) {
  const match = { organisation: organisationId };
  const [byStatus, byCategory, total] = await Promise.all([
    Request.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Request.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDoc'
        }
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categoryDoc.name', count: { $sum: 1 } } }
    ]),
    Request.countDocuments(match)
  ]);

  return {
    total,
    byStatus: byStatus.map((row) => ({ status: row._id, count: row.count })),
    byCategory: byCategory.map((row) => ({
      category: row._id || 'Uncategorised',
      count: row.count
    }))
  };
}

async function getDashboardOverview(user) {
  const organisationId = user.organisationId;
  const baseFilter = buildVisibilityFilter(user);

  const [total, pending, inProgress, completed, recent] = await Promise.all([
    Request.countDocuments(baseFilter),
    Request.countDocuments({ ...baseFilter, status: STATUSES.PENDING }),
    Request.countDocuments({ ...baseFilter, status: STATUSES.IN_PROGRESS }),
    Request.countDocuments({ ...baseFilter, status: STATUSES.COMPLETED }),
    Request.find(baseFilter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
  ]);

  return {
    stats: {
      total,
      pending,
      inProgress,
      completed,
      assigned: await Request.countDocuments({
        ...baseFilter,
        status: STATUSES.ASSIGNED
      })
    },
    recentRequests: recent.map(toPublicRequest)
  };
}

async function deleteRequest(user, requestId) {
  const request = await Request.findById(requestId);
  assertSameOrganisation(user, request);
  await Request.findByIdAndDelete(requestId);
  await Assignment.deleteMany({ request: requestId });
  await StatusUpdate.deleteMany({ request: requestId });
  await RequestComment.deleteMany({ request: requestId });
}

module.exports = {
  listRequests,
  getRequestById,
  rateAssignedOfficer,
  createRequest,
  assignRequest,
  unassignRequest,
  listAssignments,
  updateRequestStatus,
  getRequestHistory,
  listRequestComments,
  addRequestComment,
  getReportSummary,
  getDashboardOverview,
  deleteRequest
};
