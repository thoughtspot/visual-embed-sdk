import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import './index.scss';
import constants from '../../constants/ui-constants';
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

    const { width, ref } = useResizeDetector();
    
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
                            __html: navContent,
                        }}
                    />
                </nav>
            </aside>
        </ResizableBox>
    );
};

export default LeftSideBar;
