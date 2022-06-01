import React, { useEffect } from 'react';
import './index.scss';

type LinkableSectionProps = {
    children: React.ReactNode;
    tag: string,
    id: string
};

const LinkableHeader = (props: LinkableSectionProps) => {
    const Tag = props.tag as keyof JSX.IntrinsicElements;
    return (
        <Tag id={props.id} className="linkable-header">
            {props.children}
            <a href={`#${props.id}`} className="link-element">🔗</a>
        </Tag>
    );
};

export default LinkableHeader;
