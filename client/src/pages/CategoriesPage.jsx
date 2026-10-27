import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
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
    <DashboardLayout title="Request categories">
      <p className="muted">
        New organisations start with five common request types plus Other. Add any missing presets
        below or create your own categories.
      </p>

      {!loading && suggested.length > 0 && (
        <section className="card preset-categories">
          <h2>Suggested presets</h2>
          <p className="muted">One-click add common categories students use most.</p>
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

      <form className="card form-card" onSubmit={handleSubmit}>
        <h2>Add a category</h2>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </label>
        <label>
          Description (optional)
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <section className="card table-card">
        <h2>Current categories</h2>
        {loading && <LoadingSpinner layout="section" />}
        {!loading && categories.length === 0 && <p className="muted">No categories yet.</p>}
        {!loading && categories.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>{cat.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </DashboardLayout>
  );
}
