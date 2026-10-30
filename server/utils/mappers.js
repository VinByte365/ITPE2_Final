export function mapProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPresenter(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    modules: row.modules || [],
  };
}

export function mapTheme(row) {
  return {
    id: row.id,
    label: row.label,
    range: row.range_label,
    blurb: row.blurb,
    startModule: row.start_module,
    endModule: row.end_module,
    sortOrder: row.sort_order,
    moduleIds: row.module_ids || [],
  };
}

export function mapModule(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    summary: row.summary,
    pptUrl: row.ppt_url,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    theme: {
      id: row.theme_id,
      label: row.theme_label,
      range: row.theme_range,
      blurb: row.theme_blurb,
    },
    videos: row.videos || [],
    presenters: row.presenters || [],
  };
}
