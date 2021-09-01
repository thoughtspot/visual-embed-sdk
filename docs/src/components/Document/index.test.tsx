import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Document from './index';
import { addScrollListener, customizeDocContent } from './helper';


jest.mock('../../utils/lang-utils', () => (key) => key);

jest.mock('../Footer', () => () => <div data-testid="footerDiv" />);

jest.mock('./helper', () => ({
  customizeDocContent:  jest.fn(),
  addScrollListener:  jest.fn(),
}));

describe('Document', () => {
const docTitle = 'test title';
const docContent = 'test content';
const isPublicSiteOpen = false;

    it('should render correctly if isPublicSiteOpen is false', () => {
        const { container } = render(<Document docTitle={docTitle} docContent={docContent} isPublicSiteOpen={isPublicSiteOpen} />);
      expect(container).toMatchSnapshot();
    })
    it('should render correctly if isPublicSiteOpen is true', () => {
        const { container, getByTestId } = render(<Document docTitle={docTitle} docContent={docContent} isPublicSiteOpen={!isPublicSiteOpen} />);
        fireEvent.scroll(window, { target: { scrollY: 100 } })
        expect(addScrollListener).toHaveBeenCalledTimes(1);
        expect(customizeDocContent).toHaveBeenCalledTimes(1);
     
      expect(getByTestId('footerDiv')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    })
})