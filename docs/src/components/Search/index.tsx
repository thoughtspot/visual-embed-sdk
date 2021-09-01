import React, { useEffect, useState, useRef } from 'react';
import { IconContext } from '@react-icons/all-files';
import { BiSearch } from '@react-icons/all-files/bi/BiSearch';
import './index.scss';
import { SearchQueryResult } from '../../interfaces/index';
import {
    ARROW_DOWN,
    ARROW_UP,
    ENTER,
} from '../../constants/keystrokeConstants';
import t from '../../utils/lang-utils';
import SearchResult from './SearchResult';
import ToggleButton from '../ToggleButton';

type SearchProps = {
    options: SearchQueryResult[];
    leftNavOpen: boolean;
    keyword: string;
    isMaxMobileResolution: boolean;
    isDarkMode: boolean;
    optionSelected: (pageid: string) => void;
    onChange: (e: React.FormEvent<HTMLInputElement>) => void;
    updateKeyword: Function;
    setDarkMode: Function;
    isPublicSiteOpen: boolean;
};

const Search: React.FC<SearchProps> = (props) => {
    const node = useRef();
    const anchor = useRef();
    const optionListRef = useRef({});
    const [showSearchResult, updateShowSearchResult] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        if (props.options.length > 0) {
            updateShowSearchResult(true);
        }
    }, [props.options]);

    // This handles the mouse click events for suggestion list
    const handleClick = (event: Event) => {
        if (node?.current?.contains(event.target)) {
            return;
        }
        updateShowSearchResult(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [node]);

    const onFocus = () => updateShowSearchResult(true);

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!props.keyword || props.options.length === 0) return;

        const optionSize = props.options.length;

        switch (e.key) {
            case ARROW_UP:
                e.preventDefault();
                setHighlightedIndex(
                    (prev: number) => (prev - 1 + optionSize) % optionSize,
                );
                return;
            case ARROW_DOWN:
                e.preventDefault();
                setHighlightedIndex((prev: number) => (prev + 1) % optionSize);
                return;
            case ENTER:
                if (props.options[highlightedIndex].type === 'text') {
                    return;
                }
                if (props.options[highlightedIndex].type === 'html') {
                    if (anchor?.current) {
                        anchor.current.click();
                    }
                    props.updateKeyword('');
                } else {
                    props.optionSelected(
                        props.options[highlightedIndex].pageid,
                    );
                }
                setHighlightedIndex(0);
                return;
            default:
                return;
        }
    };

    const renderOption = (option: SearchQueryResult, index: number) => {
        switch (option.type) {
            case 'html':
                return (
                    <a
                        data-testid="result-link"
                        key={option.pageid}
                        className="result"
                        href={option.link}
                        target="_blank"
                        ref={anchor}
                        onClick={() => props.updateKeyword('')}
                    >
                        <SearchResult
                            highlightedIndex={highlightedIndex}
                            index={index}
                            keyword={props.keyword}
                            title={option.title}
                        />
                    </a>
                );
            case 'text':
                return (
                    <div
                        key={option.pageid}
                        className="result"
                        ref={(el: HTMLDivElement) => {
                            optionListRef.current[index] = el;
                        }}
                    >
                        <SearchResult
                            highlightedIndex={highlightedIndex}
                            index={index}
                            keyword={props.keyword}
                            title={option.title}
                            isKeywordNotFound={true}
                        />
                    </div>
                );
            default:
                return (
                    <div
                        key={option.pageid}
                        className="result"
                        onClick={() => props.optionSelected(option.pageid)}
                        ref={(el: HTMLDivElement) => {
                            optionListRef.current[index] = el;
                        }}
                    >
                        <SearchResult
                            highlightedIndex={highlightedIndex}
                            index={index}
                            keyword={props.keyword}
                            title={option.title}
                        />
                    </div>
                );
        }
    };

    if (optionListRef?.current[highlightedIndex]) {
        optionListRef?.current[highlightedIndex].scrollIntoView();
    }

    return (
        <div
            className={`searchWrapper ${props.leftNavOpen ? 'visHidden' : ''} ${!props.isPublicSiteOpen ? 'inClusterSite' : ''
                }`}
        >
            <div className="searchInputWrapper">
                <div className="searchInputContainer">
                    <IconContext.Provider
                        value={{
                            className: `icon searchIcon`,
                        }}
                    >
                        <BiSearch />
                    </IconContext.Provider>
                    <input
                        data-testid="search-input"
                        type="Search"
                        placeholder={t('SEARCH_PLACEHOLDER')}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        value={props.keyword}
                        onChange={props.onChange}
                    />
                </div>
                {showSearchResult && props.options?.length ? (
                    <div ref={node} className="resultContainer" data-testid="resultContainer">
                        {props.options.map(
                            (option: SearchQueryResult, index: number) => {
                                return renderOption(option, index);
                            },
                        )}
                    </div>
                ) : (
                        ''
                    )}
            </div>
            {props.isMaxMobileResolution && (
                <div className="ml-4">
                    <ToggleButton
                        setDarkMode={props.setDarkMode}
                        isDarkMode={props.isDarkMode}
                    />
                </div>
            )}
        </div>
    );
};

export default Search;
