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
    >
        <p className="title">{props.keyword}</p>
        <p
            className="footer"
            dangerouslySetInnerHTML={{ __html: props.title }}
        ></p>
    </div>
);

export default SearchResult;
