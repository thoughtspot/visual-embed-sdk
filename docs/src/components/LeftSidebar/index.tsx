import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import './index.scss';
import BackButton from '../BackButton';
import {
    LEFT_NAV_WIDTH_DESKTOP,
    LEFT_NAV_WIDTH_MOBILE,
    MAX_LEFT_NAV_WIDTH_DESKTOP,
    MAX_LEFT_NAV_WIDTH_MOBILE,
    MAX_MOBILE_RESOLUTION,
    MIN_LEFT_NAV_WIDTH_DESKTOP,
    MIN_LEFT_NAV_WIDTH_MOBILE
} from '../../constants/uiContants';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    handleLeftNavChange: (width: number) => void;
}) => {

    const [pageid] = useState(location.search.slice(1).split('&')[0]);
    const [navContent, setNavContent] = useState('');

    const { width, ref, height } = useResizeDetector();
    
    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.navContent;
        const tag = divElement.querySelector(`a[href='?${pageid}']`);
        if (tag) {
            tag.classList.add('active');
            tag.parentElement.classList.add('activelink');
        }
        setNavContent(divElement.innerHTML);
    }, [pageid, props.navContent]);

    useEffect(() => {
        props.handleLeftNavChange(width);
    }, [width]);

    const isMaxMobileResolution = props.docWidth > MAX_MOBILE_RESOLUTION;

    return (
        <ResizableBox
            width={isMaxMobileResolution ? LEFT_NAV_WIDTH_DESKTOP : LEFT_NAV_WIDTH_MOBILE}
            minConstraints={[isMaxMobileResolution ? MIN_LEFT_NAV_WIDTH_DESKTOP : MIN_LEFT_NAV_WIDTH_MOBILE]}
            maxConstraints={[isMaxMobileResolution ? MAX_LEFT_NAV_WIDTH_DESKTOP : MAX_LEFT_NAV_WIDTH_MOBILE]}
            axis="x"
            className="resizable"
            height={height | 0}  //Height is set to 0 when element is not rendered
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
                            __html: navContent,
                        }}
                    />
                </nav>
            </aside>
        </ResizableBox>
    );
};

export default LeftSideBar;
