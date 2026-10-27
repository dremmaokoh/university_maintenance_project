import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as categoryApi from '../api/categoryApi.js';
import * as requestApi from '../api/requestApi.js';

export default function CreateRequestPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryApi.listCategories(token).then((res) => setCategories(res.data));
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await requestApi.createRequest(token, {
        title,
        description,
        location,
        categoryId
      });
      navigate(`/requests/${res.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="New maintenance request">
      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </Layout>
  );
}
