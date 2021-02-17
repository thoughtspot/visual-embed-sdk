import React from 'react';
import { ResizableBox } from 'react-resizable';
import './index.scss';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
}) => {

    return (
        <ResizableBox
            width={310}
            minConstraints={[100, 100]}
            maxConstraints={[310]}
            axis="x"
            style={{ position: 'fixed' }}
            height={window.screen.height}
        >
            <aside>
                {props.backLink && (
                    <BackButton title="SpotDev Home" backLink={props.backLink} />
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
        </ResizableBox>
    );
};

export default LeftSideBar;
