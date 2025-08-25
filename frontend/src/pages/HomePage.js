import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Handle login logic (can post to Flask or AWS later)
    if (id && pw) {
      navigate('/associateSurvey');
    }
  };

  return (
    <div className="container text-center my-5">
      <h1>USF Bank</h1>
      <p className="lead">Login below</p>

      <div className="login-form mx-auto" style={{ maxWidth: 400 }}>
        <input
          className="form-control my-2"
          type="text"
          placeholder="User ID"
          value={id}
          onChange={e => setId(e.target.value)}
        />
        <input
          className="form-control my-2"
          type="password"
          placeholder="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
        />
        <button
          className="btn-crimson mt-3"
          onClick={handleLogin}
          disabled={!id || !pw}
        >
          Login
        </button>
      </div>
    </div>
  );
}