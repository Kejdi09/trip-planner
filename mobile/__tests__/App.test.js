import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders trip planner text', () => {
    const { getByText } = render(<App />);
    expect(getByText('Trip Planner')).toBeTruthy();
  });
});
