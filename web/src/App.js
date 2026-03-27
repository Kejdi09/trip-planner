import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function App() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateSum = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/sum?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate sum');
      }

      setResult(data.sum);
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError(`Cannot reach backend API at ${API_BASE_URL}. Start backend server and try again.`);
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Trip Planner</h1>
      <p>Quick backend test: add two numbers using the API.</p>
      <p>API URL: {API_BASE_URL}</p>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="First number"
          aria-label="First number"
        />
        <span>+</span>
        <input
          type="number"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="Second number"
          aria-label="Second number"
        />
        <button onClick={calculateSum} disabled={loading}>
          {loading ? 'Calculating...' : 'Get Sum'}
        </button>
      </div>

      {result !== null && <p>Result: {result}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

export default App;
