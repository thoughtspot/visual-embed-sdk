import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IconContext } from '@react-icons/all-files';
import { BiLinkExternal } from '@react-icons/all-files/bi/BiLinkExternal';
import { IoIosArrowForward } from '@react-icons/all-files/io/IoIosArrowForward';
import { RiArrowDownSLine } from '@react-icons/all-files/ri/RiArrowDownSLine';
import selectors from '../../constants/selectorsContant';

export const getHTMLFromComponent = (icon: JSX.Element, iconClass?: string) => {
    return ReactDOMServer.renderToStaticMarkup(
        <IconContext.Provider value={{ className: `icon ${iconClass}` }}>
            {icon}
        </IconContext.Provider>,
    );
};

const ArrowForwardHTML = getHTMLFromComponent(<IoIosArrowForward />, 'forwardArrowIcon');

const ArrowDownHTML = getHTMLFromComponent(<RiArrowDownSLine />, 'downArrowIcon');

export const addExpandCollapseImages = (
    navContent: string,
    pageId: string,
    tabsClosed: { [key: string]: boolean },
) => {
    const nav = document.createElement('div');
    nav.innerHTML = navContent;
    nav.classList.add('navWrapper');

    nav.querySelectorAll('li').forEach((el, i) => {
        if (el.children.length === 2) {
            const paragraphElement = el.children[0];
            if (paragraphElement.childNodes.length < 2) {
                paragraphElement.classList.add('linkTitle');
                const text = (paragraphElement as HTMLParagraphElement).innerText;
                // Creating arrow icons to be added
                const spanElementParent = document.createElement('span');
                spanElementParent.classList.add('iconSpan');
                const spanElementChild = document.createElement('span');
                if (tabsClosed[text] === undefined || !tabsClosed[text]) {
                    spanElementChild.innerHTML = ArrowDownHTML;
                } else {
                    spanElementChild.innerHTML = ArrowForwardHTML;
                    el.children[1].classList.add('displayNone');
                }

                // Checking if this div contains the active link
                const allLinks = el.children[1].querySelectorAll('a');
                for (let i = 0; i < allLinks.length; i++) {
                    const splitArr = allLinks[i].href.split('=');
                    if (splitArr.length > 1 && splitArr[1] === pageId) {
                        spanElementChild.innerHTML = ArrowDownHTML;
                        el.children[1].classList.remove('displayNone');
                        break;
                    }
                }

                // Adding arrow icon to the p tags
                spanElementParent.appendChild(spanElementChild);
                paragraphElement.appendChild(spanElementParent);
            }
        }
    });

    nav.innerHTML = addExternalLinkIcon(nav.innerHTML);
    return nav.innerHTML;
};

export const trimTrailingSlash = (str: string) => str.replace(/\/*$/, '');

export const getPageIdFromUrl = (href: string) => {
    const pageidMatches = href.match(/pageid=([A-z-0-9]*)/);
    const pageid = pageidMatches && pageidMatches.length > 1 && pageidMatches[1];

    return pageid;
};

const isLinkMatching = (href: string, pageid: string) => href && href.includes(`pageid=${pageid}`);

const isCurrentNavOpen = (liEle: HTMLLIElement, pageid: string) => {
    const paraEle = liEle.children[0] as HTMLParagraphElement;
    const divEle = liEle.children[1] as HTMLDivElement;

    const isLinkParentOpen =
        paraEle && isLinkMatching((paraEle.children[0] as HTMLAnchorElement).href, pageid);

    const isChildOpen: boolean =
        divEle &&
        Array.from(divEle.children[0].children)
            .map((childLiEle): boolean => isCurrentNavOpen(childLiEle as HTMLLIElement, pageid))
            .reduce((prev, cur) => prev || cur, false);

    return isLinkParentOpen || isChildOpen;
};

export const collapseAndExpandLeftNav = (
    doc: HTMLDivElement,
    setLeftNavOpen: Function,
    toggleExpandOnTab: Function,
    pageid: string,
) => {
    // Adding click listener to close left nav when in mobile resolution
    doc.querySelectorAll(selectors.links).forEach((link) => {
        link.addEventListener('click', () => {
            setLeftNavOpen(false);
        });
    });

    doc.querySelectorAll('li').forEach((el, i) => {
        if (el.children.length === 2) {
            const spanElement =
                el.children[0].children.length === 2
                    ? el.children[0].children[1]
                    : el.children[0].children[0];

            const isOpen = pageid && isCurrentNavOpen(el, pageid);
            const divElement = el.children[1];
            if (!isOpen) {
                divElement.classList.toggle('displayNone');
            }

            if (spanElement) {
                (spanElement
                    .children[0] as HTMLImageElement).innerHTML = divElement.classList.contains(
                    'displayNone',
                )
                    ? ArrowForwardHTML
                    : ArrowDownHTML;
                 // Adding click listener to the headings
                if (el.children[0].querySelectorAll('a').length === 0) {
                    // adding listener to headers that are not linked
                    el.children[0].addEventListener('click', () => {
                        toggleExpandOnTab(
                            (el.children[0] as HTMLParagraphElement).innerText,
                        );
                        divElement.classList.toggle('displayNone');
                        (spanElement
                            .children[0] as HTMLImageElement).innerHTML = divElement.classList.contains(
                            'displayNone',
                        )
                            ? ArrowForwardHTML
                            : ArrowDownHTML;
                    });
                } else {
                    // Adding click listener to the headings with links
                    spanElement.addEventListener('click', () => {
                        console.log('here2');
                        toggleExpandOnTab(
                            (el.children[0] as HTMLParagraphElement).innerText,
                        );
                        divElement.classList.toggle('displayNone');
                        (spanElement
                            .children[0] as HTMLImageElement).innerHTML = divElement.classList.contains(
                            'displayNone',
                        )
                            ? ArrowForwardHTML
                            : ArrowDownHTML;
                    });
                }
            }
        }
    });
};

export const getAllPageIds = (navContent: string): string[] => {
    const divElement = document.createElement('div');
    divElement.innerHTML = navContent;
    const allPageIds = [];
    divElement.querySelectorAll('a').forEach((link: HTMLAnchorElement) => {
        const splitArr = link.href.split('?');
        if (splitArr.length > 1) {
            const urlParams = new URLSearchParams(splitArr[1]);
            const pageId = urlParams.get('pageid');
            if (pageId) {
                allPageIds.push(pageId);
            }
        }
    });
    return allPageIds;
};

// Adding external icon to the external links
const addExternalLinkIcon = (navContent: string): string => {
    const divElement = document.createElement('div');
    divElement.innerHTML = navContent;
    divElement.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const tempElement = document.createElement('span');
        tempElement.innerHTML = ReactDOMServer.renderToStaticMarkup(
            <IconContext.Provider value={{ className: 'icon externalLinkIcon' }}>
                <BiLinkExternal />
            </IconContext.Provider>,
        );
        link.appendChild(tempElement);
    });
    return divElement.innerHTML;
};
