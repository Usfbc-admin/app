// src/pages/SurveyPage.js
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useNavigate, useParams } from 'react-router-dom'; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionCard from '../components/QuestionCard';
import NavButtons from '../components/NavButtons';
import '../style.css';

export default function SurveyPage() {
  const { surveyId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [resp, setResp] = useState({});
  const [idx, setIdx] = useState(0);
  const [desktop, setDesktop] = useState(window.innerWidth > 768);
  const [user, setUser] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showQuestion, setShowQuestion] = useState(true); 
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { width, height } = useWindowSize();
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth > 768);
    window.addEventListener('resize', onResize);

    // Check authentication first
    axios.get(`${API}/usf/me`, { withCredentials: true })
      .then(r => {
        if (r.data.logged_in) {
          setUser(r.data.user);
          loadSurveyData();
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'));

    return () => window.removeEventListener('resize', onResize);
  }, [API, surveyId, navigate]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      
      // If no surveyId in URL, redirect to admin to select survey
      if (!surveyId) {
        navigate('/admin');
        return;
      }

      // Load survey details
      const surveyResponse = await axios.get(`${API}/usf/surveys/${surveyId}`, { withCredentials: true });
      setSurvey(surveyResponse.data.survey);

      // Load questions for this survey
      const questionsResponse = await axios.get(`${API}/usf/questions?survey_id=${surveyId}`, { withCredentials: true });
      setQuestions(questionsResponse.data.questions);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading survey:', error);
      setError('Error loading survey. Please try again.');
      setLoading(false);
    }
  };

  const isAdmin = user === 'ADMIN';
  const totalScore = Object.entries(resp).reduce(
    (sum, [i, val]) => sum + (questions[i]?.weight || 0) * val,
    0
  );

  const transitionTo = (newIdx) => {
    setShowQuestion(false);
    setTimeout(() => {
      setIdx(newIdx);
      setShowQuestion(true);
    }, 300);
  };

  const handleSubmit = async () => {
    try {
      // Submit responses to backend
      const responseData = {};
      questions.forEach((question, index) => {
        if (resp[index]) {
          responseData[question.id] = resp[index];
        }
      });

      await axios.post(`${API}/usf/responses`, {
        survey_id: surveyId,
        responses: responseData
      }, { withCredentials: true });

      setSubmitted(true);
      
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('Error submitting survey. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
          Back to Admin
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="thank-you text-center">
        <ReactConfetti width={width} height={height} />
        <div style={{ fontSize: '4rem', color: 'green' }}>✔</div>
        <h2>Thank you for your submission!</h2>
        <p>Your responses have been recorded for survey: <strong>{survey?.survey_description}</strong></p>
        <p>You'll be redirected shortly...</p>
        <button
          className="btn-crimson mt-3"
          onClick={() => {
            setResp({});
            setIdx(0);
            setShowIntro(true);
            setSubmitted(false);
            navigate('/');
          }}
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!survey || questions.length === 0) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning" role="alert">
          No questions found for this survey. Please contact your administrator.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
          Back to Admin
        </button>
      </div>
    );
  }

  return (
    <div className="container my-4">
      {(desktop || showIntro) && (
        <>
          <h2>{survey.survey_description}</h2>
          <p><strong>Team Name:</strong></p>
          <p>The {survey.survey_description} has been developed to help managers better assess-through 
            observation and experience-the extent and effectiveness he or she engages in 
            coaching activities and behaviors and provides a working environment conducive to coaching 
            and motivating their team. Coaches and Managers may use the team cumulative 
            results (no individual results will be shared, only average team scores will be shared), along 
            with other learning tools to determine what areas of coaching may need more time, focus, and attention.
            It is important to be unbiased and candid in your response to ensure the Coach or Manager obtains the maximum 
            benefit from this assessment for the team. 
          </p>
          <p>
            <strong>Direction:</strong> The {survey.survey_description} consists of a series of thought-provoking 
            concepts related to effective coaching and management. Please select the number that best identifies the extent 
            to which you engage in this activity or behavior. Select your answers according to the following three-point scale:
          </p>
          <div className="alert alert-info">
            <strong>Scale:</strong>
            <ul className="mb-0">
              <li><strong>1 - Rarely:</strong> This behavior is rarely observed or practiced</li>
              <li><strong>2 - Sometimes:</strong> This behavior is sometimes observed or practiced</li>
              <li><strong>3 - Frequently:</strong> This behavior is frequently observed or practiced</li>
            </ul>
          </div>
          {!desktop && (
            <div className="text-center mb-4">
              <button
                className="btn-crimson"
                onClick={() => setShowIntro(false)}
                disabled={questions.length === 0}
              >
                Start Survey
              </button>
            </div>
          )}
        </>
      )}

      {!desktop && !showIntro && questions.length > 0 && (
        <>
          <div className="mb-3">
            <small className="text-muted">
              Question {idx + 1} of {questions.length} | Survey: {survey.survey_description}
            </small>
          </div>
          <QuestionCard
            question={questions[idx]}
            value={resp[idx] || 0}
            onChange={v => {
              setResp(prev => ({ ...prev, [idx]: v }));
            }}
            index={idx}
            total={questions.length}
            show={showQuestion}
          />
          <NavButtons
            idx={idx}
            max={questions.length - 1}
            onPrev={() => {
              if (idx > 0) transitionTo(idx - 1);
              else setShowIntro(true);
            }}
            onNext={() => transitionTo(idx + 1)}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {desktop && (
        <div className="desktop-table">
          <div className="mb-3">
            <h4>Survey: {survey.survey_description}</h4>
            <p className="text-muted">{questions.length} questions</p>
          </div>
          <table className="table table-striped table-hover">
            <thead className="usf-table-header">
              <tr>
                {isAdmin && <th>Category</th>}
                <th>#</th>
                <th>Description</th>
                <th>Rarely (1)</th>
                <th>Sometimes (2)</th>
                <th>Frequently (3)</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  {isAdmin && <td>{q.category}</td>}
                  <td>{q.id}</td>
                  <td>{q.description}</td>
                  {[1, 2, 3].map(val => (
                    <td key={val} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={resp[i] === val}
                        onChange={() => setResp({ ...resp, [i]: val })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center mt-4">
            <button 
              className="btn-crimson btn-lg"
              onClick={handleSubmit}
              disabled={Object.keys(resp).length === 0}
            >
              Submit Survey
            </button>
          </div>
        </div>
      )}
    </div>
  );
}