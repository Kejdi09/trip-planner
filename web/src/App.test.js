import { render, screen } from '@testing-library/react';
import App from './App';

test('renders trip planner heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /Trip Planner/i });
  expect(heading).toBeInTheDocument();
});
