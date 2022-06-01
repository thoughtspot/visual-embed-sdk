import React from 'react'
import { render } from '@testing-library/react'
import LinkableHeader from './index'

describe('Linkable Header', () => {
    it('Should render the right content', () => {
        const { container } = render(<LinkableHeader tag="h4" id="test-id">Test Header Content</LinkableHeader>);
        expect(container).toMatchSnapshot();
    })
})
