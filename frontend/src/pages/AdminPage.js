import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminPage() {
  const API = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const { surveyId } = useParams(); // Get surveyId from URL
  const [questions, setQuestions] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(surveyId || '');
  const [editing, setEditing] = useState({});
  const [newQ, setNewQ] = useState({
    survey_id: surveyId || '',
    survey_description: '',
    category: '',
    description: '',
    weight: 1
  });
  const [newSurvey, setNewSurvey] = useState({
    survey_id: '',
    survey_description: ''
  });
  const [error, setError] = useState('');

  const loadQuestions = (surveyId) => {
    if (!surveyId) {
      setQuestions([]);
      return;
    }
    
    axios.get(`${API}/usf/questions?survey_id=${surveyId}`)
      .then(r => setQuestions(r.data.questions))
      .catch(() => setError('Error loading questions'));
  };

  const loadSurveys = () => {
    axios.get(`${API}/usf/surveys`, { withCredentials: true })
      .then(r => setSurveys(r.data.surveys))
      .catch(() => setError('Error loading surveys'));
  };

  useEffect(() => {
    axios.get(`${API}/usf/me`, { withCredentials: true })
      .then(r => {
        if (!r.data.logged_in) navigate('/login');
        else {
          loadSurveys();
          if (selectedSurvey) {
            loadQuestions(selectedSurvey);
          }
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate, API, selectedSurvey]);

  const handleSurveySelect = (surveyId) => {
    setSelectedSurvey(surveyId);
    setNewQ({ ...newQ, survey_id: surveyId });
    loadQuestions(surveyId);
    // Update URL
    navigate(`/admin/${surveyId}`);
  };

  const handleUpdate = (q) => {
    axios.put(`${API}/usf/questions/${q.id}`, q, { withCredentials: true })
      .then(() => loadQuestions(selectedSurvey));
  };

  const handleDelete = (id) => {
    axios.delete(`${API}/usf/questions/${id}`, { withCredentials: true })
      .then(() => loadQuestions(selectedSurvey));
  };

  const handleCreateQuestion = () => {
    if (!selectedSurvey) {
      setError('Please select a survey first');
      return;
    }
    
    axios.post(`${API}/usf/questions`, newQ, { withCredentials: true })
      .then(() => {
        setNewQ({ 
          survey_id: selectedSurvey, 
          survey_description: '', 
          category: '', 
          description: '', 
          weight: 1 
        });
        loadQuestions(selectedSurvey);
      })
      .catch(() => setError('Error creating question'));
  };

  const handleCreateSurvey = () => {
    if (!newSurvey.survey_id || !newSurvey.survey_description) {
      setError('Please fill in both survey ID and description');
      return;
    }
    
    axios.post(`${API}/usf/surveys`, newSurvey, { withCredentials: true })
      .then(() => {
        setNewSurvey({ survey_id: '', survey_description: '' });
        loadSurveys();
        setError('');
      })
      .catch(() => setError('Error creating survey'));
  };

  const handleEditQuestion = (q) => {
    setEditing({ ...editing, [q.id]: { ...q } });
  };

  const handleSaveEdit = (id) => {
    handleUpdate(editing[id]);
    setEditing({ ...editing, [id]: null });
  };

  const handleCancelEdit = (id) => {
    setEditing({ ...editing, [id]: null });
  };

  const handleEditChange = (id, field, value) => {
    setEditing({
      ...editing,
      [id]: { ...editing[id], [field]: value }
    });
  };

  return (
    <div className="container my-4">
      <h2>Survey Admin</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Create New Survey Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Create New Survey</h4>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input 
                type="text" 
                placeholder="Survey ID (e.g., ASSOC180)" 
                className="form-control"
                value={newSurvey.survey_id} 
                onChange={e => setNewSurvey({ ...newSurvey, survey_id: e.target.value })} 
              />
            </div>
            <div className="col-md-6">
              <input 
                type="text" 
                placeholder="Survey Description" 
                className="form-control"
                value={newSurvey.survey_description} 
                onChange={e => setNewSurvey({ ...newSurvey, survey_description: e.target.value })} 
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success" onClick={handleCreateSurvey}>
                Create Survey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Selection */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Select Survey to Edit</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <select 
                className="form-control" 
                value={selectedSurvey} 
                onChange={e => handleSurveySelect(e.target.value)}
              >
                <option value="">Select a survey...</option>
                {surveys.map(survey => (
                  <option key={survey.survey_id} value={survey.survey_id}>
                    {survey.survey_id} - {survey.survey_description}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/survey/${selectedSurvey}`)}
                disabled={!selectedSurvey}
              >
                Preview Survey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Section */}
      {selectedSurvey && (
        <div className="card mb-4">
          <div className="card-header">
            <h4>Add New Question to {selectedSurvey}</h4>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-3">
                <input 
                  type="text" 
                  placeholder="Survey Description" 
                  className="form-control"
                  value={newQ.survey_description} 
                  onChange={e => setNewQ({ ...newQ, survey_description: e.target.value })} 
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="text" 
                  placeholder="Category" 
                  className="form-control"
                  value={newQ.category} 
                  onChange={e => setNewQ({ ...newQ, category: e.target.value })} 
                />
              </div>
              <div className="col-md-4">
                <input 
                  type="text" 
                  placeholder="Question Description" 
                  className="form-control"
                  value={newQ.description} 
                  onChange={e => setNewQ({ ...newQ, description: e.target.value })} 
                />
              </div>
              <div className="col-md-1">
                <input 
                  type="number" 
                  className="form-control" 
                  min="1" 
                  value={newQ.weight} 
                  onChange={e => setNewQ({ ...newQ, weight: parseInt(e.target.value) })} 
                />
              </div>
              <div className="col-md-1">
                <button className="btn btn-success" onClick={handleCreateQuestion}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Table */}
      {selectedSurvey && (
        <div className="card">
          <div className="card-header">
            <h4>Questions for {selectedSurvey}</h4>
          </div>
          <div className="card-body">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>
                      {editing[q.id] ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          value={editing[q.id].category}
                          onChange={e => handleEditChange(q.id, 'category', e.target.value)}
                        />
                      ) : (
                        q.category
                      )}
                    </td>
                    <td>
                      {editing[q.id] ? (
                        <textarea 
                          className="form-control form-control-sm"
                          value={editing[q.id].description}
                          onChange={e => handleEditChange(q.id, 'description', e.target.value)}
                        />
                      ) : (
                        q.description
                      )}
                    </td>
                    <td>
                      {editing[q.id] ? (
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          min="1"
                          value={editing[q.id].weight}
                          onChange={e => handleEditChange(q.id, 'weight', parseInt(e.target.value))}
                        />
                      ) : (
                        q.weight
                      )}
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        {editing[q.id] ? (
                          <>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleSaveEdit(q.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleCancelEdit(q.id)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEditQuestion(q)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(q.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No questions found for this survey.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}