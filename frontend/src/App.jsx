import { useEffect, useState } from 'react';
import './App.css';

function collapseSpaces(s) {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

// Valid if: only A–Z letters and single spaces between words (at least one letter)
function isValidName(raw) {
  const name = collapseSpaces(raw);
  return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name);
}

// Clean to send to API (collapse spaces + trim)
function cleanName(raw) {
  return collapseSpaces(raw);
}

// Check if dob is valid 
function validateDob(dob) {
  if (!dob) return false;
  const date = new Date(dob);
  if (isNaN(date.getTime())) return false;

  const minDate = new Date("1900-01-01");
  const today = new Date();

  return date >= minDate && date <= today;
}

// Calculate age from dob (yyyy-mm-dd)
function calculateAge(dob) {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '';
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Inline form state
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    age: '',
    date_of_birth: '',
  });

  // Field-level errors for names
  const [fieldErrors, setFieldErrors] = useState({ firstname: '', lastname: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load users on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setFetchError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Create user (inline form)
  const createUser = async (e) => {
    e?.preventDefault?.();
    setFormError('');
    setFieldErrors({ firstname: '', lastname: '' });

    // Validate names on submit
    let hasError = false;
    if (!isValidName(form.firstname)) {
      setFieldErrors((p) => ({ ...p, firstname: 'Only letters and single spaces allowed (e.g. "John Adam").' }));
      hasError = true;
    }
    if (!isValidName(form.lastname)) {
      setFieldErrors((p) => ({ ...p, lastname: 'Only letters and single spaces allowed (e.g. "Smith").' }));
      hasError = true;
    }
    if (!validateDob(form.date_of_birth)) {
      setFormError('Please select a valid date of birth.');
      hasError = true;
    }
    if (hasError) return; // don't submit if validation error
    const computedAge = calculateAge(form.date_of_birth);

    const payload = {
      firstname: cleanName(form.firstname),
      lastname: cleanName(form.lastname),
      age: computedAge === '' ? null : Number(computedAge),
      date_of_birth: form.date_of_birth,
    };

    setSaving(true);
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newUser = await res.json();
      setUsers((prev) => [...prev, newUser]);
      setForm({ firstname: '', lastname: '', age: '', date_of_birth: '' });
    } catch (err) {
      console.error(err);
      setFormError('Could not create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete user (no confirmation)
  const deleteUser = async (id) => {
    const key = (u) => u.user_id ?? u.id;
    const prev = [...users];
    setUsers((curr) => curr.filter((u) => key(u) !== id));

    try {
      const res = await fetch(`/api/user?user_id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error(err);
      // revert on error
      setUsers(prev);
      alert('Failed to delete user.');
    }
  };


  const onNameChange = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    // live-clear error when it looks valid or empty
    setFieldErrors((p) => ({
      ...p,
      [key]: value === '' || isValidName(value) ? '' : p[key],
    }));
  };

  const onNameBlur = (key) => (e) => {
    const value = e.target.value;
    setFieldErrors((p) => ({
      ...p,
      [key]: value && !isValidName(value) ? 'Only letters and single spaces allowed.' : '',
    }));
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand">User Management</span>
        </div>
      </nav>

      {/* Main */}
      <div className="container py-4">
        {fetchError && <div className="alert alert-danger">{fetchError}</div>}

        {/* Add User (inline card) */}
        <div className="card shadow-sm mb-3">
          <div className="card-header bg-white">
            <strong>Add User</strong>
          </div>
          <div className="card-body">
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={createUser} noValidate>
              <div className="row g-3">
                {/* First Name */}
                <div className="col-md-3">
                  <div className="form-floating">
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.firstname ? 'is-invalid' : ''}`}
                      id="firstname"
                      placeholder="First name"
                      value={form.firstname}
                      onChange={onNameChange('firstname')}
                      onBlur={onNameBlur('firstname')}
                      required
                    />
                    <label htmlFor="firstname">First name</label>
                    {fieldErrors.firstname && (
                      <div className="invalid-feedback">{fieldErrors.firstname}</div>
                    )}
                  </div>
                </div>

                {/* Last Name */}
                <div className="col-md-3">
                  <div className="form-floating">
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.lastname ? 'is-invalid' : ''}`}
                      id="lastname"
                      placeholder="Last name"
                      value={form.lastname}
                      onChange={onNameChange('lastname')}
                      onBlur={onNameBlur('lastname')}
                      required
                    />
                    <label htmlFor="lastname">Last name</label>
                    {fieldErrors.lastname && (
                      <div className="invalid-feedback">{fieldErrors.lastname}</div>
                    )}
                  </div>
                </div>

                {/* DOB */}
                <div className="col-md-3">
                  <div className="form-floating">
                    <input
                      type="date"
                      className="form-control"
                      id="dob"
                      value={form.date_of_birth}
                      min="1900-01-01"
                      max={new Date().toISOString().split("T")[0]}   // <-- today
                      onChange={(e) => {
                        setForm((f) => ({ ...f, date_of_birth: e.target.value }));
                      }}
                      onBlur={(e) => {
                        const dob = e.target.value;
                        const age = calculateAge(dob);
                        setForm((f) => ({
                          ...f,
                          age,
                        }));
                        if (validateDob(dob)) setFormError('');
                      }}
                      required
                    />
                    <label htmlFor="dob">Date of birth</label>
                  </div>
                </div>

                {/* Age (read-only) */}
                <div className="col-md-2">
                  <div className="form-floating">
                    <input
                      type="number"
                      className="form-control bg-light"
                      id="age"
                      placeholder=" "
                      value={form.age}
                      readOnly
                    />
                    <label htmlFor="age">Age</label>
                  </div>
                </div>

                {/* Add button */}
                <div className="col-md-1 d-grid">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Save
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Users table */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <strong>Users</strong>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="d-flex align-items-center justify-content-center py-4">
                <div className="spinner-border" role="status" />
                <span className="ms-2">Loading…</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No users yet. Add one above.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: 120 }}>ID</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th style={{ width: 180 }}>Date of Birth</th>
                      <th style={{ width: 100 }}>Age</th>
                      <th className="text-end" style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const id = u.user_id ?? u.id;
                      return (
                        <tr key={id}>
                          <td className="text-muted">{id}</td>
                          <td className="fw-semibold">{u.firstname}</td>
                          <td>{u.lastname}</td>
                          <td>{u.date_of_birth}</td>
                          <td>{u.age}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteUser(id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
