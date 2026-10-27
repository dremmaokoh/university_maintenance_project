const Category = require('../models/Category');
const HttpError = require('../utils/httpError');

function toPublicCategory(category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description
  };
}

async function listCategories() {
  const categories = await Category.find().sort({ name: 1 });
  return categories.map(toPublicCategory);
}

async function createCategory({ name, description }) {
  const existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) {
    throw new HttpError(409, 'A category with this name already exists.');
  }

  const category = await Category.create({ name, description: description || '' });
  return toPublicCategory(category);
}

async function updateCategory(id, updates) {
  const category = await Category.findById(id);
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

async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new HttpError(404, 'Category not found.');
  }
}

module.exports = {
  toPublicCategory,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
