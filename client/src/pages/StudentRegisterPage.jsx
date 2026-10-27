import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import AuthTextField from '../components/auth/AuthTextField.jsx';
import AuthPasswordField from '../components/auth/AuthPasswordField.jsx';
import AuthSelectField from '../components/auth/AuthSelectField.jsx';
import { EnvelopeIcon, UserIcon } from '../components/auth/AuthIcons.jsx';
import * as organisationApi from '../api/organisationApi.js';
import '../styles/login.css';

const PASSWORD_MIN_LENGTH = 8;

function validateRegisterForm({ fullName, email, password, memberType }) {
  const errors = {};
  if (!fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }
  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!memberType) {
    errors.memberType = 'Choose whether you are Staff or Student.';
  }
  return errors;
}

export default function StudentRegisterPage() {
  const { orgSlug } = useParams();
  const { registerStudent } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memberType, setMemberType] = useState('student');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setOrgLoading(true);
    organisationApi
      .getOrganisationBySlug(orgSlug)
      .then((res) => setOrg(res.data))
      .catch(() => {
        setOrg(null);
        showError('Invalid organisation link.');
      })
      .finally(() => setOrgLoading(false));
  }, [orgSlug, showError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const errors = validateRegisterForm({ fullName, email, password, memberType });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await registerStudent(orgSlug, fullName.trim(), email.trim(), password, memberType);
      showSuccess('Account created.');
      navigate('/requests');
    } catch (err) {
      const message = err.message || 'Could not create your account. Please try again.';
      if (err.status === 409 || /already exists/i.test(message)) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
      } else {
        setFormError(message);
        showError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (orgLoading) {
    return <LoadingSpinner layout="page" />;
  }

  if (!org) {
    return (
      <div className="login-page">
        <div className="login-page__backdrop" aria-hidden="true" />
        <div className="login-card page-enter">
          <p className="login-card__brand">Resolva</p>
          <p className="login-form-error">This organisation link is not valid.</p>
          <p className="login-auth-switch">
            <Link to="/">Go home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden="true" />

      <div className="login-card page-enter">
        <p className="login-card__brand">Resolva</p>
        <p className="login-card__eyebrow">Staff &amp; Students registration</p>
        <h1 className="login-card__title">Create your account</h1>
        <p className="login-card__subtitle">
          Join your institution on Resolva to report maintenance issues and track their progress.
        </p>
        <p className="login-institution">Registering with {org.name}</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="login-form-error" role="alert">
              {formError}
            </p>
          )}

          <AuthSelectField
            id="register-member-type"
            label="Account type"
            value={memberType}
            onChange={(e) => {
              setMemberType(e.target.value);
              setFieldErrors((prev) => ({ ...prev, memberType: undefined }));
            }}
            error={fieldErrors.memberType}
          >
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </AuthSelectField>

          <AuthTextField
            id="register-full-name"
            label="Full name"
            name="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            error={fieldErrors.fullName}
            icon={<UserIcon />}
            autoComplete="name"
          />

          <AuthTextField
            id="register-email"
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={fieldErrors.email}
            icon={<EnvelopeIcon />}
            autoComplete="email"
          />

          <AuthPasswordField
            id="register-password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
          />

          <button
            type="submit"
            className={`login-submit${submitting ? ' login-submit--busy' : ''}`}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting && <span className="login-submit__spinner" aria-hidden="true" />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="login-auth-switch">
          Already signed up? <Link to={`/o/${orgSlug}/login`}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
