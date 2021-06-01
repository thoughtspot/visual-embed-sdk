import React, { useEffect } from 'react';
import './index.scss';
import { customizeDocContent, addScrollListener } from './helper';

const Document = (props: { docTitle: string; docContent: string }) => {
    useEffect(() => {
        customizeDocContent();
    }, [props.docContent]);

    useEffect(() => {
        addScrollListener();
    }, []);

    return (
        <div className="documentWrapper">
            <div
                id={props.docTitle}
                dangerouslySetInnerHTML={{
                    __html: props.docContent,
                }}
            />
        </div>
    );
};

export default Document;
