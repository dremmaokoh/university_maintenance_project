const Organisation = require('../models/Organisation');
const Category = require('../models/Category');
const HttpError = require('../utils/httpError');
const { uniqueOrgSlug } = require('../utils/slugify');
const { normalizeAuthEmail } = require('../utils/normalizeAuthEmail');

const { PRESET_CATEGORIES } = require('../constants/presetCategories');
const DEFAULT_CATEGORIES = PRESET_CATEGORIES;

function toPublicOrganisation(org) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug
  };
}

async function getOrganisationBySlug(slug) {
  const org = await Organisation.findOne({ slug: slug.toLowerCase() });
  if (!org) {
    throw new HttpError(404, 'Organisation not found.');
  }
  return toPublicOrganisation(org);
}

async function findOrganisationByCreatorEmail(email) {
  const normalizedEmail = normalizeAuthEmail(email);
  const legacyLower = String(email).trim().toLowerCase();
  return Organisation.findOne({
    $or: [{ createdByEmail: normalizedEmail }, { createdByEmail: legacyLower }]
  });
}

async function emailHasCreatedOrganisation(email) {
  const existing = await findOrganisationByCreatorEmail(email);
  return Boolean(existing);
}

async function createOrganisation({ name, createdByEmail }) {
  const normalizedEmail = normalizeAuthEmail(createdByEmail);
  if (await emailHasCreatedOrganisation(normalizedEmail)) {
    throw new HttpError(
      409,
      'This email has already been used to create an organisation. Kindly log in.'
    );
  }

  const slug = await uniqueOrgSlug(Organisation, name);
  const organisation = await Organisation.create({
    name,
    slug,
    createdByEmail: normalizedEmail
  });

  for (const item of DEFAULT_CATEGORIES) {
    await Category.create({
      ...item,
      organisation: organisation.id
    });
  }

  return organisation;
}

module.exports = {
  toPublicOrganisation,
  getOrganisationBySlug,
  findOrganisationByCreatorEmail,
  emailHasCreatedOrganisation,
  createOrganisation,
  DEFAULT_CATEGORIES
};
