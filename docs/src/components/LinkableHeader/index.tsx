import React, { useEffect } from 'react';
import './index.scss';

type LinkableSectionProps = {
    children: React.ReactNode;
    tag: string,
    id: string
};

const LinkableHeader = (props: LinkableSectionProps) => {
    function copyLink(event) {
        const link = new URL(location.href);
        link.hash = event.target.dataset?.hash ?? '';
        const textareaElement = document.createElement('textarea');
        textareaElement.id = "copy-link-text";
        textareaElement.value = link.href;
        document.body.appendChild(textareaElement);
        textareaElement.select();
        document.execCommand('copy');
        document.body.removeChild(textareaElement);
    }

    const Tag = props.tag as keyof JSX.IntrinsicElements;

    return (
        <Tag id={props.id} className="copy-link-header">
            {props.children}
            <button onClick={copyLink} title="Copy link" data-hash={props.id} className="copy-link-button">🔗</button>
        </Tag>
    );
};

export default LinkableHeader;
