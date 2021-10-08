import React from "react"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { act } from 'react-dom/test-utils';

import Search from './index';
import { SearchQueryResult } from '../../interfaces/index';

jest.mock('../../utils/lang-utils', () => (key) => key);
const getPageUrl = () => window.location.href.split(/[?#]/)[0];
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('Search', () => {
    const searchPropsWithOptions = {
        keyword: "test",
        onChange: jest.fn(),
        options: [{
            pageid: 'page1',
            title: 'test title',
            _snippetResult: {
                body: {
                    value: 'test content',
                }
            },
            type: 'html',
            link: '/',
        },
        {
            pageid: 'page2',
            title: 'test title',
            _snippetResult: {
                body: {
                    value: 'test content',
                }
            },
            type: 'html',
            link: '/',
        },
        {
            pageid: 'page3',
            title: 'test title',
            _snippetResult: {
                body: {
                    value: 'test content',
                }
            },
            type: 'text',
            link: '/',
        }] as SearchQueryResult[],
        optionSelected: jest.fn(),
        leftNavOpen: false,
        updateKeyword: jest.fn(),
        isMaxMobileResolution: false,
        setDarkMode: jest.fn(),
        isDarkMode: false,
        isPublicSiteOpen: false,
    }

    const searchPropsWithoutOptions = {
        keyword: "test keyword",
        onChange: jest.fn(),
        options: [] as SearchQueryResult[],
        optionSelected: jest.fn(),
        leftNavOpen: true,
        updateKeyword: jest.fn(),
        isMaxMobileResolution: false,
        setDarkMode: jest.fn(),
        isDarkMode: false,
        isPublicSiteOpen: false,
    }

    it('should render correctly without options', () => {
        const { container, queryByTestId } = render(<Search  {...searchPropsWithoutOptions} />);
        expect(container).toMatchSnapshot();
        expect(queryByTestId('search-result')).toBeNull();
        expect(queryByTestId('resultContainer')).toBeNull();
    })

    it('should not show search results when options are not present and keyword is blank', () => {
        const { queryByTestId } = render(<Search  {...searchPropsWithoutOptions} />);
        expect(queryByTestId('search-result')).toBeNull();
        expect(queryByTestId('resultContainer')).toBeNull();
    })

    it('should render correctly with options', async () => {
        const { container, queryByTestId, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');
        const resultContainer = await getByTestId('resultContainer');

        act(() => {
            fireEvent.focus(input);
        })

        expect(container).toMatchSnapshot();
        expect(queryAllByTestId('search-result').length).toBe(3);
        expect(resultContainer).toBeInTheDocument();
    })

    it('should show results on focus', async () => {
        const { queryByTestId, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');
        const resultContainer = await getByTestId('resultContainer');

        act(() => {
            fireEvent.focus(input);
        })
        expect(queryAllByTestId('search-result').length).toBe(3);
        expect(resultContainer).toBeInTheDocument();
    })

    it('should not show results on mouse down input', async () => {
        const { queryByTestId, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');
        const resultContainer = await getByTestId('resultContainer');

        act(() => {
            fireEvent.mouseDown(input);
        })
        expect(queryAllByTestId('search-result').length).toBe(0);
        expect(resultContainer).not.toBeInTheDocument();
    })

    it('should highlight text on key down arrow down and arrow up ', async () => {
        const { container, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');

        act(() => {
            fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
        })

        expect(container).toMatchSnapshot();
        expect(queryAllByTestId('search-result')[1]).toHaveClass('active');

        act(() => {
            fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
        })
        expect(queryAllByTestId('search-result')[0]).toHaveClass('active');
        expect(queryAllByTestId('search-result')[0].firstChild.textContent).toBe('test title');
        expect(input.value).toBe('test');
    })

    it('should keyword and input value on enter', async () => {
        const { container, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');

        act(() => {
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        })

        expect(queryAllByTestId('search-result').length).toBe(0);
        //hiding search suggestions once the user clicks enter
    })

    it('should do nothing if any key other than arrow up, down and enter is pressed', async () => {
        const { container, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');

        act(() => {
            fireEvent.keyDown(input, { key: 'ArrowRight', code: 'ArrowRight' });
        })

        expect(queryAllByTestId('search-result')[1]).not.toHaveClass('active');
    })

    it('should do nothing if option type is text', async () => {
        const { container, queryAllByTestId, getByTestId } = render(<Search  {...searchPropsWithOptions} />);
        const input = await getByTestId('search-input');

        act(() => {
            fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
        })

        expect(queryAllByTestId('search-result')[2]).toHaveClass('active');
    })
})