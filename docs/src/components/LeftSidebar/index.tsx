import React from 'react';
import './index.scss';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    spotDevHomeLink: string;
}) => (
    <aside>
        {props.spotDevHomeLink && (
            <BackButton
                title="SpotDev Home"
                spotDevHomeLink={props.spotDevHomeLink}
            />
        )}
        <nav>
            <h2 className="heading">{props.navTitle}</h2>
            <div
                className="navWrapper"
                dangerouslySetInnerHTML={{
                    __html: props.navContent,
                }}
            />
        </nav>
    </aside>
);

export default LeftSideBar;
