import React from 'react';
import BackButton from '../BackButton';

const NavContent = (props: {
    refObj: React.RefObject<HTMLDivElement>;
    backLink: string;
    navTitle: string;
    leftNavOpen: boolean;
    navContent: string;
}) => {
    return (
        <aside
            ref={props.refObj}
            className={props.leftNavOpen ? 'asideDisplay' : ''}
        >
            {props.backLink && (
                <BackButton title="Back" backLink={props.backLink} />
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
};

export default NavContent;
