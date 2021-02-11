import React from 'react';
import './index.scss';

const Document = (props: { docTitle: string; docContent: string }) => (
    <div className="documentWrapper">
        <div
            id={props.docTitle}
            dangerouslySetInnerHTML={{
                __html: props.docContent,
            }}
        />
    </div>
);

export default Document;
