const Category = require('../models/Category');
const HttpError = require('../utils/httpError');
const { PRESET_CATEGORIES } = require('../constants/presetCategories');

function toPublicCategory(category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description
  };
}

function isOtherCategoryName(name) {
  return String(name || '').trim().toLowerCase() === 'other';
}

function sortCategoriesForDisplay(categories) {
  return [...categories].sort((a, b) => {
    const aIsOther = isOtherCategoryName(a.name);
    const bIsOther = isOtherCategoryName(b.name);
    if (aIsOther && !bIsOther) {
      return 1;
    }
    if (!aIsOther && bIsOther) {
      return -1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

async function listCategories(organisationId) {
  const categories = await Category.find({ organisation: organisationId }).sort({ name: 1 });
  return sortCategoriesForDisplay(categories.map(toPublicCategory));
}

async function listSuggestedPresets(organisationId) {
  const existing = await Category.find({ organisation: organisationId }).select('name');
  const existingNames = new Set(existing.map((cat) => cat.name.trim().toLowerCase()));
  return PRESET_CATEGORIES.filter((preset) => !existingNames.has(preset.name.trim().toLowerCase()));
}

async function createCategory(organisationId, { name, description }) {
  const existing = await Category.findOne({
    organisation: organisationId,
    name: new RegExp(`^${name}$`, 'i')
  });
  if (existing) {
    throw new HttpError(409, 'A category with this name already exists.');
  }

  const category = await Category.create({
    name,
    description: description || '',
    organisation: organisationId
  });
  return toPublicCategory(category);
}

async function updateCategory(organisationId, id, updates) {
  const category = await Category.findOne({ _id: id, organisation: organisationId });
  if (!category) {
    throw new HttpError(404, 'Category not found.');
  }

  if (updates.name) {
    category.name = updates.name;
  }
  if (typeof updates.description === 'string') {
    category.description = updates.description;
  }

  await category.save();
  return toPublicCategory(category);
}

async function deleteCategory(organisationId, id) {
  const category = await Category.findOneAndDelete({ _id: id, organisation: organisationId });
  if (!category) {
    throw new HttpError(404, 'Category not found.');
  }
}

module.exports = {
  toPublicCategory,
  listCategories,
  listSuggestedPresets,
  createCategory,
  updateCategory,
  deleteCategory
};
