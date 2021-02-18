import React, { useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import './index.scss';
import constants from '../../static/constants/ui-constants';
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
            width={props.docWidth > constants.maxMobileResolution ? constants.leftNavWidthDesktop : constants.leftNavWidthMobile}
            minConstraints={[props.docWidth > constants.maxMobileResolution ? constants.minLeftNavWidthDesktop : constants.minLeftNavWidthMobile]}
            maxConstraints={[props.docWidth > constants.maxMobileResolution ? constants.maxLeftNavWidthDesktop : constants.maxLeftNavWidthMobile]}
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
