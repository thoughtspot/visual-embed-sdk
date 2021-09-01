import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { toHaveStyle } from '@testing-library/jest-dom'

import ToggleButton from './index';

describe('ToggleButton', () => {

    const setDarkMode = jest.fn();
    const isDarkMode = false;
    it("should renders correctly", () => {
        const { container } = render(<ToggleButton setDarkMode={setDarkMode} isDarkMode={isDarkMode} />);

        expect(container).toMatchSnapshot()
    })

    it("should toggle correctly", () => {
        const { getByTestId, getByText } = render(<ToggleButton setDarkMode={setDarkMode} isDarkMode={isDarkMode} />);
        const toggleBtn = getByTestId('toggle-btn');
        act(() => {
            fireEvent.click(toggleBtn)
        })
        expect(setDarkMode).toHaveBeenCalledTimes(1);
        expect(setDarkMode).toHaveBeenCalledWith(true);
    })
})