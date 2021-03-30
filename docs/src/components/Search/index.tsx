import React, { useEffect, useState, useRef } from 'react';
import './index.scss';
import { SearchQueryResult } from '../../interfaces/index';
import {
    ARROW_DOWN,
    ARROW_UP,
    ENTER,
} from '../../constants/keystrokeConstants';

type SearchProps = {
    options: SearchQueryResult[];
    keyword: string;
    optionSelected: (pageid: string) => void;
    onChange: (e: React.FormEvent<HTMLInputElement>) => void;
};

const Search: React.FC<SearchProps> = (props) => {
    const node = useRef();
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
        if (node.current && node.current.contains(event.target)) {
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
                props.optionSelected(props.options[highlightedIndex].pageid);
                setHighlightedIndex(0);
                return;
            default:
                return;
        }
    };

    if (optionListRef?.current[highlightedIndex]) {
        optionListRef?.current[highlightedIndex].scrollIntoView();
    }

    return (
        <div className="searchWrapper">
            <div className="searchInputWrapper">
                <input
                    type="Search"
                    placeholder="Search Documentation"
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    value={props.keyword}
                    onChange={props.onChange}
                />
                {showSearchResult && (
                    <div ref={node} className="resultContainer">
                        {props.options.map(
                            (option: SearchQueryResult, index: number) => (
                                <div
                                    key={option.pageid}
                                    className="result"
                                    onClick={() =>
                                        props.optionSelected(option.pageid)
                                    }
                                    ref={(el: HTMLDivElement) => {
                                        optionListRef.current[index] = el;
                                    }}
                                >
                                    <div
                                        className={`textContainer 
                                    ${index === highlightedIndex && 'active'}`}
                                    >
                                        <p className="title">{props.keyword}</p>
                                        <p className="footer">{option.title}</p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
