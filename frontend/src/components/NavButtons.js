import React from 'react';

export default function NavButtons({ idx, max, onPrev, onNext, onSubmit }) {
  return (
    <div className="navigation-buttons">
      <button
        className="btn btn-secondary"
        onClick={onPrev}
        style={{ visibility: idx>0 ? 'visible':'hidden' }}
      >Previous</button>
      {idx<max ? (
        <button className="btn btn-crimson text-white" onClick={onNext}>Next</button>
      ) : (
        <button className="btn btn-success" onClick={onSubmit}>Submit</button>
      )}
    </div>
  );
}