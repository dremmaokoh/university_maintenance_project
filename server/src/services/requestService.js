const Request = require('../models/Request');
const Assignment = require('../models/Assignment');
const StatusUpdate = require('../models/StatusUpdate');
const Category = require('../models/Category');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { ROLES, STATUSES, ALLOWED_TRANSITIONS } = require('../constants');

function toPublicRequest(request) {
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
    updatedAt: request.updatedAt
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
  if (user.role === ROLES.ADMIN) {
    return {};
  }
  if (user.role === ROLES.OFFICER) {
    return { assignedOfficer: user.id };
  }
  return { requester: user.id };
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

  if (!request) {
    throw new HttpError(404, 'Request not found.');
  }

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

  const category = await Category.findById(payload.categoryId);
  if (!category) {
    throw new HttpError(400, 'Please choose a valid category.');
  }

  const request = await Request.create({
    title: payload.title,
    description: payload.description,
    location: payload.location,
    category: category.id,
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
  if (!request) {
    throw new HttpError(404, 'Request not found.');
  }

  const officer = await User.findById(officerId);
  if (!officer || officer.role !== ROLES.OFFICER || !officer.isActive) {
    throw new HttpError(400, 'Please choose an active maintenance officer.');
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

async function listAssignments() {
  const assignments = await Assignment.find()
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
  if (!request) {
    throw new HttpError(404, 'Request not found.');
  }

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

async function getRequestHistory(user, requestId) {
  await getRequestById(user, requestId);
  const history = await StatusUpdate.find({ request: requestId })
    .populate('actor', 'fullName role')
    .sort({ createdAt: 1 });
  return history.map(toPublicStatusUpdate);
}

async function getReportSummary() {
  const [byStatus, byCategory, total] = await Promise.all([
    Request.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Request.aggregate([
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
    Request.countDocuments()
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

async function deleteRequest(requestId) {
  const request = await Request.findByIdAndDelete(requestId);
  if (!request) {
    throw new HttpError(404, 'Request not found.');
  }
  await Assignment.deleteMany({ request: requestId });
  await StatusUpdate.deleteMany({ request: requestId });
}

module.exports = {
  listRequests,
  getRequestById,
  createRequest,
  assignRequest,
  listAssignments,
  updateRequestStatus,
  getRequestHistory,
  getReportSummary,
  deleteRequest
};
