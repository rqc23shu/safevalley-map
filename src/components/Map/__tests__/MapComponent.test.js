// MapComponent.test.js
// Jest test for MapComponent - checks that the map renders without crashing
// Note: This is a basic smoke test for demonstration and marking purposes
//       For full testing, consider using React Testing Library and mocking Leaflet/Firebase

import React from 'react';
import { render } from '@testing-library/react';
import MapComponent from '../MapComponent';

describe('MapComponent', () => {
  it('renders without crashing', () => {
    // Render the map with minimal required props
    render(<MapComponent selectedTravelMode="all" />);
    // No assertion needed: test passes if no error is thrown
  });
}); 