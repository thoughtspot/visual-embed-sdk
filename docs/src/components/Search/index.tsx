import React from 'react';
import './index.scss';

const Search = ({ options, ...props }) => (
    <div className="searchWrapper">
        <div className="searchInputWrapper">
            <input
                type="Search"
                placeholder="Search Documentation"
                {...props}
            />
            {options.length > 0 && 
                <div className="resultContainer">
                    {options.map((option) => (
                        <div key={option.pageid} className="result">
                            <div className="textContainer">
                                <p className="title">{props.value}</p>
                                <p className="footer">{option.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    </div>
);

export default Search;
