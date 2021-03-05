import React, { useEffect, useState } from 'react';
import './index.scss';
import { customizeDocContent } from './helper';

const Document = (props: { docTitle: string; docContent: string }) => {

    useEffect(() => {
        customizeDocContent();
    }, [props.docContent]);

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
