// src/components/QuestionCard.js
import React from 'react';
import { CSSTransition } from 'react-transition-group';
import './QuestionCard.css';

export default function QuestionCard({ question, value, onChange, index, total, show }) {
  return (
    <CSSTransition
      in={show}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <div
        className="question-card d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: '80vh', padding: '1rem' }}
      >
        <div className="question-number mb-2 text-center">
          Question {index + 1} of {total}
        </div>
        <div className="question-text mb-3 text-center" style={{ fontSize: '1.25rem', fontWeight: '500' }}>
          {question.description}
        </div>
        <div className="options text-center">
          {['Rarely', 'Sometimes', 'Frequently'].map((label, i) => {
            const val = i + 1;
            return (
              <label key={val} className="d-block mb-2">
                <input
                  type="radio"
                  name={`q-${index}`}
                  checked={value === val}
                  onChange={() => onChange(val)}
                  className="me-2"
                />
                {label}
              </label>
            );
          })}
        </div>
      </div>
    </CSSTransition>
  );
}