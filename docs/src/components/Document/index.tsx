import React, { useEffect, useState } from 'react';
import './index.scss';
import { customizeDocContent } from './helper';

const Document = (props: { docTitle: string; docContent: string }) => {

    const [docContent, setDocContent] = useState('');

    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.docContent;
        customizeDocContent(divElement, setDocContent);
    }, [props.docContent]);

    return (
        <div className="documentWrapper">
            <div
                id={props.docTitle}
                dangerouslySetInnerHTML={{
                    __html: docContent,
                }}
            />
        </div>
    );
};

export default Document;
