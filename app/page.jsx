'use client';

import { useState, useEffect } from 'react';

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');

  async function loadFeedback() {
    const res = await fetch('/api/feedback');
    const data = await res.json();
    setFeedbackList(data);
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('Submitting...');
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text }),
    });
    if (!res.ok) {
      setStatus('Submission failed — check your input.');
      return;
    }
    setName('');
    setText('');
    setStatus('Submitted!');
    loadFeedback();
  }

  async function handleDelete(id) {
    // FIX #4: client no longer claims isAdmin; server checks the real key.
    // For this lab, the admin key is typed by the user at delete-time
    // (in a real app this would come from a logged-in session/token).
    const key = window.prompt('Enter admin key to delete:');
    if (!key) return; 

    const res = await fetch('/api/feedback', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      alert('Delete forbidden — wrong or missing admin key.');
      return;
    }
    loadFeedback();
  }

  return (
    <div>
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '500px' }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <textarea
          placeholder="Your feedback"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Submit
        </button>
        {status && <p style={{ color: 'green' }}>{status}</p>}
      </form>

      <h2 style={{ marginTop: '2rem' }}>All Feedback</h2>
      {feedbackList.length === 0 && <p>No feedback yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {feedbackList.map((item) => (
          <li
            key={item.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <strong>{item.name}</strong>
            <span style={{ color: '#888', marginLeft: '1rem', fontSize: '0.85rem' }}>
              {item.createdAt}
            </span>
            {/* FIX #3: render as plain text instead of raw HTML */}
            <p>{item.text}</p>
            <button
              onClick={() => handleDelete(item.id)}
              style={{ background: '#c00', color: '#fff', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '3px' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}