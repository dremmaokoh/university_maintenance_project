import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import FieldLabel from '../components/FieldLabel.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import EmptyState from '../components/admin/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as categoryApi from '../api/categoryApi.js';

export default function CategoriesPage() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingPreset, setAddingPreset] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  function loadCategories() {
    setLoading(true);
    Promise.all([
      categoryApi.listCategories(token),
      categoryApi.listSuggestedCategories(token)
    ])
      .then(([catRes, sugRes]) => {
        setCategories(catRes.data);
        setSuggested(sugRes.data);
      })
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCategories();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await categoryApi.createCategory(token, { name, description });
      setName('');
      setDescription('');
      setShowAddForm(false);
      showSuccess('Category added.');
      loadCategories();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function addPreset(preset) {
    setAddingPreset(preset.name);
    try {
      await categoryApi.createCategory(token, {
        name: preset.name,
        description: preset.description
      });
      showSuccess(`${preset.name} added.`);
      loadCategories();
    } catch (err) {
      showError(err.message);
    } finally {
      setAddingPreset(null);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Categories"
        description="Define request types so staff and students can classify maintenance issues consistently."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Close form' : 'Add category'}
          </button>
        }
      />

      {showAddForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h2 className="admin-section__title">New category</h2>
          <label>
            <FieldLabel required>Name</FieldLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </label>
          <label>
            <FieldLabel optional>Description</FieldLabel>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Save category'}
          </button>
        </form>
      )}

      {!loading && suggested.length > 0 && (
        <section className="card preset-categories">
          <h2 className="admin-section__title">Suggested presets</h2>
          <p className="admin-section__lead">Add common categories your organisation may be missing.</p>
          <ul className="preset-categories__list">
            {suggested.map((preset) => (
              <li key={preset.name} className="preset-categories__item">
                <div>
                  <strong>{preset.name}</strong>
                  {preset.description && (
                    <p className="muted preset-categories__desc">{preset.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={addingPreset === preset.name}
                  onClick={() => addPreset(preset)}
                >
                  {addingPreset === preset.name ? 'Adding…' : 'Add'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card table-card">
        <h2 className="admin-section__title">Current categories</h2>
        {loading && <LoadingSpinner layout="section" />}
        {!loading && categories.length === 0 && (
          <EmptyState
            title="No categories yet"
            message="Add a category or use a suggested preset to get started."
          />
        )}
        {!loading && categories.length > 0 && (
          <div className="table-scroll">
            <table className="data-table data-table--comfortable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td><strong>{cat.name}</strong></td>
                    <td>{cat.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
