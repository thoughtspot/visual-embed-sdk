import React, { useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import './index.scss';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    handleLeftNavChange
}) => {

    const { width, ref } = useResizeDetector();

    useEffect(() => {
        props.handleLeftNavChange(width + 7);
    }, [width]);

    return (
        <ResizableBox
            width={props.docWidth > 1024 ? 310 : 260}
            minConstraints={[100]}
            maxConstraints={[400]}
            axis="x"
            style={{ position: 'fixed' }}
            height={window.screen.height}
        >
            <aside ref={ref}>
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
