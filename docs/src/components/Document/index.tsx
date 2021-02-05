import React from 'react';
import './index.scss';

const Document = (props: { docTitle: string; docContent: string }) => (
    <div className="documentWrapper">
        <span
            dangerouslySetInnerHTML={{
                __html: `<b>Title:</b> ${props.docTitle}`,
            }}
        />
        <b>Document Content:</b>
        <div
            dangerouslySetInnerHTML={{
                __html: props.docContent,
            }}
        />
    </div>
);

export default Document;
