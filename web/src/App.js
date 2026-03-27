import React, { useState } from 'react';

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
        `http://localhost:3001/sum?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate sum');
      }

      setResult(data.sum);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Trip Planner</h1>
      <p>Quick backend test: add two numbers using the API.</p>

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
