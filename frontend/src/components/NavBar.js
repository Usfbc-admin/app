// src/components/NavBar.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './NavBar.css';

export default function NavBar() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/usf/login`,
        { id: username, pw: password },
        { withCredentials: true }
      );
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Login failed: check your credentials');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark usf-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">USF</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#usfNavbar"
          aria-controls="usfNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="usfNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/public">Public</Link>
            </li>
          </ul>

          <form className="d-flex usf-login-form ms-auto" onSubmit={handleLogin}>
            <input
              type="text"
              className="form-control me-2"
              placeholder="UserName"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="form-control me-2"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-light">Log In</button>
          </form>
        </div>
      </div>
    </nav>
  );
}
