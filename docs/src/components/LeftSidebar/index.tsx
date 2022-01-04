import React, { useEffect, useState, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import { useResizeDetector } from 'react-resize-detector';
import { IconContext } from '@react-icons/all-files';
import { GiHamburgerMenu } from '@react-icons/all-files/gi/GiHamburgerMenu';
import { MdClear } from '@react-icons/all-files/md/MdClear';
import { RiMoonClearLine } from '@react-icons/all-files/ri/RiMoonClearLine';
import { FiSun } from '@react-icons/all-files/fi/FiSun';
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
import { collapseAndExpandLeftNav, addExpandCollapseImages } from './helper';
import NavContent from './NavContent';
import './index.scss';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
    docWidth: number;
    leftNavOpen: boolean;
    isMaxMobileResolution: boolean;
    isDarkMode: boolean;
    handleLeftNavChange: (width: number) => void;
    location: Location;
    setLeftNavOpen: Function;
    isPublicSiteOpen: boolean;
    setDarkMode: Function;
}) => {
    const params = queryStringParser(props.location.search);
    const [navContent, setNavContent] = useState('');
    const { width, ref, height } = useResizeDetector();

    const expandedTabsRef = useRef({});

    const isMaxTabletResolution = !(props.docWidth < MAX_TABLET_RESOLUTION);
    const isMaxMobileResolution = !(props.docWidth < MAX_MOBILE_RESOLUTION);

    useEffect(() => {
        const divElement = document.createElement('div');
        divElement.innerHTML = props.navContent;
        const tag = divElement.querySelector(
            `a[href='${params[NAV_PREFIX]}=${params[TS_PAGE_ID_PARAM]}']`,
        );
        if (tag) {
            tag.classList.add('active');
        }
        const updatedHTML = addExpandCollapseImages(
            divElement.innerHTML,
            params[TS_PAGE_ID_PARAM],
            expandedTabsRef.current,
        );
        setNavContent(updatedHTML);
    }, [params[NAV_PREFIX], params[TS_PAGE_ID_PARAM], props.navContent]);

    useEffect(() => {
        props.handleLeftNavChange(ref.current.offsetWidth);
    }, [width]);

    useEffect(() => {
        collapseAndExpandLeftNav(
            ref.current as HTMLDivElement,
            props.setLeftNavOpen,
            toggleExpandOnTab,
        );
    }, [params[TS_PAGE_ID_PARAM], isMaxMobileResolution, navContent]);

    const onMenuClick = () => {
        props.setLeftNavOpen(!props.leftNavOpen);
        document.documentElement.scrollTop = 0;
    };

    const toggleExpandOnTab = (text: string) => {
        const allTabsRef = { ...expandedTabsRef.current };
        if (allTabsRef[text] !== undefined) {
            allTabsRef[text] = !allTabsRef[text];
        } else {
            allTabsRef[text] = true;
        }
        expandedTabsRef.current = { ...allTabsRef };
    };

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
                    isMaxMobileResolution={isMaxMobileResolution}
                    setDarkMode={props.setDarkMode}
                    isDarkMode={props.isDarkMode}
                />
            </ResizableBox>
        ) : (
                <div className="menuMain">
                    <div className="menuContainer">
                        <IconContext.Provider
                            value={{
                                className: `icon ${props.leftNavOpen && 'imgOpacity'
                                    }`,
                            }}
                        >
                            <GiHamburgerMenu onClick={onMenuClick} />
                        </IconContext.Provider>
                        <IconContext.Provider
                            value={{
                                className: `icon ${props.leftNavOpen && 'imgOpacity'
                                    }`,
                            }}
                        >
                            {props.isDarkMode
                                ? <RiMoonClearLine onClick={() => props.setDarkMode(false)} />
                                : <FiSun onClick={() => props.setDarkMode(true)} />
                            }
                        </IconContext.Provider>
                        <IconContext.Provider
                            value={{
                                className: `icon ${!props.leftNavOpen && 'imgOpacity'
                                    } clearIcon`,
                            }}
                        >
                            <MdClear onClick={onMenuClick} />
                        </IconContext.Provider>
                    </div>
                    <NavContent
                        backLink={props.backLink}
                        navContent={navContent}
                        navTitle={props.navTitle}
                        refObj={ref as React.RefObject<HTMLDivElement>}
                        leftNavOpen={props.leftNavOpen}
                        isPublicSiteOpen={props.isPublicSiteOpen}
                        isMaxMobileResolution={isMaxMobileResolution}
                        setDarkMode={props.setDarkMode}
                        isDarkMode={props.isDarkMode}
                    />
                </div>
            );
    };

    return renderLeftNav();
};

export default LeftSideBar;
