import React, { useEffect, useState } from 'react';
import './index.scss';
import Copy from '../../assets/svg/copy.svg';

const Document = (props: { docTitle: string; docContent: string }) => {

    const [docContent, setDocContent] = useState('');

    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.docContent;
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
    }, [props.docContent]);

    const addCopyFeature = () => {
        document.querySelectorAll('.listingblock>.content>.highlight>button').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const textareaElement = document.createElement("textarea");
                textareaElement.value = (document.querySelectorAll('.listingblock>.content>.highlight>code')[index] as HTMLElement).innerText;
                btn.parentElement.appendChild(textareaElement);
                textareaElement.select();
                document.execCommand("copy");
                btn.parentElement.removeChild(textareaElement);
            })
        });
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
