import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/usf/login`, {
        id,
        pw
      }, {
        withCredentials: true
      });

      if (res.data.success) {
        const meRes = await axios.get(`${process.env.REACT_APP_API_URL}/usf/me`, {
          withCredentials: true
        });

        if (meRes.data.logged_in && meRes.data.user === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/associateSurvey');
        }
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login error. Please try again.');
    }
  };

  return (
    <div className="container text-center my-5">
      <h1>USF Bank</h1>
      <div className="login-form mx-auto" style={{ maxWidth: 400 }}></div>
      <input
        className="form-control my-2"
        placeholder="User ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <input
        className="form-control my-2"
        type="password"
        placeholder="Password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button className="btn-crimson mt-2" onClick={handleLogin} disabled={!id || !pw}>
        Login
      </button>
      <p className="mt-3">
        Don't have an account? <a href="/register">Sign up here</a>
      </p>
    </div>
  );
}