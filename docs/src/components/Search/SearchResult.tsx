import React from 'react';

type SearchResultProps = {
    index: number;
    highlightedIndex: number;
    keyword: string;
    title: string;
    isKeywordNotFound?: boolean;
};

const SearchResult = (props: SearchResultProps) => (
    <div
        className={`${!props.isKeywordNotFound && 'textContainer'} 
        ${props.index === props.highlightedIndex && 'active'}`}
        data-testid="search-result"
    >
        <p className="title"
            dangerouslySetInnerHTML = {{ __html: props.keyword }}
        ></p>
        <p
            className="footer"
            dangerouslySetInnerHTML={{ __html: props.title }}
        ></p>
    </div>
);

export default SearchResult;
