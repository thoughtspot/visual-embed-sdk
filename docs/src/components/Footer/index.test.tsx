import React from 'react';
import { render } from '@testing-library/react';

import Footer from './index';

jest.mock('../../utils/lang-utils', () => (key) => key);

describe('Footer', () => {
  it("should renders correctly", () => {
    const { container } = render(<Footer />);
    expect(container).toMatchSnapshot()
  })
})