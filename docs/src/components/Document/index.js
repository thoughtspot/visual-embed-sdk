import React from 'react';
import PropTypes from 'prop-types';
import './index.scss';

const Document = ({ docTitle, docContent }) => (
    <div className="documentWrapper">
        <span
            dangerouslySetInnerHTML={{
                __html: `<b>Title:</b> ${docTitle}`,
            }}
        />
        <b>Document Content:</b>
        <div
            dangerouslySetInnerHTML={{
                __html: docContent,
            }}
        />
    </div>
);

Document.propTypes = {
    docTitle: PropTypes.string.isRequired,
    docContent: PropTypes.string.isRequired,
};

export default Document;
