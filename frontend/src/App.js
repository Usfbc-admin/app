import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import NavBar from './components/NavBar';
import SurveyPage from './pages/SurveyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Render NavBar at the top level so it appears on every route */}
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:surveyId" element={<AdminPage />} />
        <Route path="/survey/:surveyId" element={<SurveyPage />} />
        {/* Keep legacy route for backward compatibility */}
        <Route path="/associateSurvey" element={<SurveyPage />} />
      </Routes>
    </BrowserRouter>
  );
}