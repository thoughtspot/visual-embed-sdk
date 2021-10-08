import React from 'react';
import cx from 'classnames';
type SearchResultProps = {
    index: number;
    highlightedIndex: number;
    keyword: string;
    title: string;
    isKeywordNotFound?: boolean;
};

const SearchResult = (props: SearchResultProps) => { 
    const searchResultContent = props.title + '...';
    return (
        <div
            className={ cx(
              { textContainer : !props.isKeywordNotFound },
              { active: props.index === props.highlightedIndex }
            )}
            data-testid="search-result"
        >
            <p className="title"
                dangerouslySetInnerHTML = {{ __html: props.keyword }}
            ></p>
            <p
                className="footer"
                dangerouslySetInnerHTML={{ __html: searchResultContent }}
            ></p>
        </div>
    )
};

export default SearchResult;
