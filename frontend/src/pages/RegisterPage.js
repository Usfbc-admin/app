import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/usf/register`, {
        id,
        pw,
        email,
      });

      if (res.data.success) {
        // Attempt to login immediately after registration
        const loginRes = await axios.post(`${process.env.REACT_APP_API_URL}/usf/login`, {
          id,
          pw,
        }, { withCredentials: true });

        if (loginRes.data.success) {
          // Fetch user role
          const meRes = await axios.get(`${process.env.REACT_APP_API_URL}/usf/me`, {
            withCredentials: true
          });
          const loggedUser = meRes.data.user;

          if (loggedUser === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/associateSurvey');
          }
        } else {
          setError('Login after registration failed.');
        }
      } else {
        setError(res.data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration error. Please try again.');
    }
  };

  return (
    <div className="container text-center my-5">
      <h1>Create An Account</h1>
      <input
        className="form-control my-2"
        placeholder="User ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <input
        className="form-control my-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="form-control my-2"
        type="password"
        placeholder="Password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        className="btn-crimson mt-2"
        onClick={handleRegister}
        disabled={!id || !pw || !email}
      >
        Sign Up
      </button>
    </div>
  );
}