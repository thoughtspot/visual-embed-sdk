import React, { useEffect, useState } from 'react';
import './index.scss';
import Copy from '../../assets/svg/copy.svg';
import addCopyFeature from './copyFunctionality';

const Document = (props: { docTitle: string; docContent: string }) => {

    const [docContent, setDocContent] = useState('');

    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.docContent;
        addCopyButton(divElement);
    }, [props.docContent]);

    const addCopyButton = (divElement: HTMLElement) => {
        const allTags = divElement.querySelectorAll('.listingblock>.content>.highlight>code');
        if (allTags.length > 0) {
            divElement.querySelectorAll('.listingblock>.content>.highlight>code').forEach((tag) => {
                const buttonElement = document.createElement('button');
                buttonElement.setAttribute('class', 'copyButton');
                const imageElement = document.createElement('img');
                imageElement.src = Copy;
                imageElement.alt = 'Copy';
                imageElement.title = 'Copy';
                buttonElement.appendChild(imageElement);
                tag.parentElement.appendChild(buttonElement);
            });
        }
        setDocContent(divElement.innerHTML)
        setTimeout(() => {
            addCopyFeature();
        }, 500);
    };

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
