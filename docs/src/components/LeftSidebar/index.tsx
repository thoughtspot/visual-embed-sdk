import React, { useEffect, useState } from 'react';
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
} from '../../constants/ui-constants';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    handleLeftNavChange: Function;
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
                            __html: navContent,
                        }}
                    />
                </nav>
            </aside>
        </ResizableBox>
    );
};

export default LeftSideBar;
