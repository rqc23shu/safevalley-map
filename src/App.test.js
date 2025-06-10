import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders SafeValley Map title and travel mode filter', () => {
  render(<App />);
  expect(screen.getByText(/SafeValley Map/i)).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});
