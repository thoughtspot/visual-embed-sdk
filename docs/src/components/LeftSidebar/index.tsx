import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import queryStringParser from '../../utils/app-utils';
import { NAV_PREFIX, TS_PAGE_ID_PARAM } from '../../configs/doc-configs';
import {
    LEFT_NAV_WIDTH_DESKTOP,
    LEFT_NAV_WIDTH_TABLET,
    MAX_LEFT_NAV_WIDTH_DESKTOP,
    MAX_LEFT_NAV_WIDTH_TABLET,
    MAX_TABLET_RESOLUTION,
    MIN_LEFT_NAV_WIDTH_DESKTOP,
    MIN_LEFT_NAV_WIDTH_TABLET,
    MAX_MOBILE_RESOLUTION,
} from '../../constants/uiConstants';
import ClearIcon from '../../assets/svg/clear.svg';
import MenuIcon from '../../assets/svg/menu.svg';
import NavContent from './NavContent';
import './index.scss';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    leftNavOpen: boolean;
    handleLeftNavChange: (width: number) => void;
    location: Location;
    setLeftNavOpen: Function;
    isPublicSiteOpen: boolean;
}) => {
    const params = queryStringParser(props.location.search);
    const [navContent, setNavContent] = useState('');
    const { width, ref, height } = useResizeDetector();

    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.navContent;
        const tag = divElement.querySelector(
            `a[href='${params[NAV_PREFIX]}=${params[TS_PAGE_ID_PARAM]}']`,
        );
        if (tag) {
            tag.classList.add('active');
        }
        setNavContent(divElement.innerHTML);
    }, [params, props.navContent]);

    useEffect(() => {
        props.handleLeftNavChange(width);
    }, [width]);

    const onMenuClick = () => {
        props.setLeftNavOpen(!props.leftNavOpen);
        document.documentElement.scrollTop = 0;
    };

    const isMaxTabletResolution = !(props.docWidth < MAX_TABLET_RESOLUTION);
    const isMaxMobileResolution = !(props.docWidth < MAX_MOBILE_RESOLUTION);

    const renderLeftNav = () => {
        return isMaxMobileResolution ? (
            <ResizableBox
                width={
                    isMaxTabletResolution
                        ? LEFT_NAV_WIDTH_DESKTOP
                        : LEFT_NAV_WIDTH_TABLET
                }
                minConstraints={[
                    isMaxTabletResolution
                        ? MIN_LEFT_NAV_WIDTH_DESKTOP
                        : MIN_LEFT_NAV_WIDTH_TABLET,
                ]}
                maxConstraints={[
                    isMaxTabletResolution
                        ? MAX_LEFT_NAV_WIDTH_DESKTOP
                        : MAX_LEFT_NAV_WIDTH_TABLET,
                ]}
                axis="x"
                className="resizable"
                height={height || 0} //Height is set to 0 when element is not rendered
            >
                <NavContent
                    backLink={props.backLink}
                    navContent={navContent}
                    navTitle={props.navTitle}
                    refObj={ref as React.RefObject<HTMLDivElement>}
                    leftNavOpen={props.leftNavOpen}
                    isPublicSiteOpen={props.isPublicSiteOpen}
                />
            </ResizableBox>
        ) : (
            <div className="menuMain">
                <div className="menuContainer">
                    <img
                        src={MenuIcon}
                        className={`${props.leftNavOpen && 'imgOpacity'}`}
                        onClick={onMenuClick}
                    />
                    <img
                        src={ClearIcon}
                        className={`${!props.leftNavOpen && 'imgOpacity'}`}
                        onClick={onMenuClick}
                    />
                </div>
                <NavContent
                    backLink={props.backLink}
                    navContent={navContent}
                    navTitle={props.navTitle}
                    refObj={ref as React.RefObject<HTMLDivElement>}
                    leftNavOpen={props.leftNavOpen}
                    isPublicSiteOpen={props.isPublicSiteOpen}
                />
            </div>
        );
    };

    return renderLeftNav();
};

export default LeftSideBar;
