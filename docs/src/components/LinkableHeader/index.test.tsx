import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import LinkableHeader from './index'

describe('Linkable Header', () => {
    it('Should render the right content', () => {
        const { container } = render(<LinkableHeader tag="h4" id="test-id">Test Header Content</LinkableHeader>);
        expect(container).toMatchSnapshot();
        fireEvent.click(screen.getByText('🔗'));
    })
    it('Should should clean up itself after the click', () => {
        const { container } = render(<LinkableHeader tag="h4" id="test-id">Test Header Content</LinkableHeader>);
        fireEvent.click(screen.getByText('🔗'));
        expect(container.querySelectorAll('#copy-link-text').length == 0);
    })

})
