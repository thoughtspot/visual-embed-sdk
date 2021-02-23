import React, { useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import './index.scss';
import {
    leftNavWidthDesktop,
    leftNavWidthMobile,
    maxLeftNavWidthDesktop,
    maxLeftNavWidthMobile,
    maxMobileResolution,
    minLeftNavWidthDesktop,
    minLeftNavWidthMobile
} from '../../static/constants/ui-constants';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    handleLeftNavChange: Function;
}) => {

    const { width, ref, height } = useResizeDetector();

    useEffect(() => {
        props.handleLeftNavChange(width);
    }, [width]);

    return (
        <ResizableBox
            width={props.docWidth > maxMobileResolution ? leftNavWidthDesktop : leftNavWidthMobile}
            minConstraints={[props.docWidth > maxMobileResolution ? minLeftNavWidthDesktop : minLeftNavWidthMobile]}
            maxConstraints={[props.docWidth > maxMobileResolution ? maxLeftNavWidthDesktop : maxLeftNavWidthMobile]}
            axis="x"
            style={{ position: 'fixed' }}
            height={height}
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
