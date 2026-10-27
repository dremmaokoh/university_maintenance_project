function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function uniqueOrgSlug(Organisation, baseName) {
  let base = slugify(baseName) || 'organisation';
  let slug = base;
  let counter = 1;

  while (await Organisation.findOne({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

module.exports = {
  slugify,
  uniqueOrgSlug
};
