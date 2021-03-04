import React, { useEffect, useState, useRef } from 'react';
import './index.scss';

const Search = ({ options, optionSelected, value, ...props }) => {
    const node = useRef();
    const optionListRef = useRef({});
    const [showSearchResult, updateShowSearchResult] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        if (options.length > 0) {
            updateShowSearchResult(true);
        }
    }, [options]);

    // This handles the mouse click events for suggestion list
    const handleClick = (event) => {
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

    const onKeyDown = (e) => {
        if (!value || options.length === 0) return;

        const optionSize = options.length;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(
                    (prev) => (prev - 1 + optionSize) % optionSize,
                );
                return;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % optionSize);
                return;
            case 'Enter':
                optionSelected(options[highlightedIndex].redirectURL);
                setHighlightedIndex(0);
                return;
            default: return;
        }
    }

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
                    value={value}
                    {...props}
                />
                {showSearchResult && (
                    <div ref={node} className="resultContainer">
                        {options.map((option, index) => (
                            <div
                                key={option.pageid}
                                className="result"
                                onClick={() =>
                                    optionSelected(option.redirectURL)
                                }
                                ref={(el) => {
                                    optionListRef.current[index] = el;
                                }}
                            >
                                <div
                                    className={`textContainer 
                                    ${index === highlightedIndex && 'active'}`}
                                >
                                    <p className="title">{value}</p>
                                    <p className="footer">{option.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Search;
