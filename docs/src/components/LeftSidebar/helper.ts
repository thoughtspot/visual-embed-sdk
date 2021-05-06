import React from 'react';
import ArrowDown from '../../assets/svg/arrowDown.svg';
import ArrowForward from '../../assets/svg/arrowForward.svg';
import selectors from '../../constants/selectorsContant';

export const addExpandCollapseImages = (navContent: string, pageId: string) => {
    const nav = document.createElement('div');
    nav.innerHTML = navContent;
    nav.classList.add('navWrapper');
    nav.querySelectorAll(selectors.headings).forEach((tag, index) => {
        const divElement = nav.querySelectorAll(
            selectors.linksContainer,
        )[index];
        if (!!divElement) {
            //Creating arrow icons to be added
            const spanElement = document.createElement('span');
            spanElement.classList.add('iconSpan');
            const imageElement = document.createElement('img');
            imageElement.src = ArrowForward;
            divElement.classList.add('displayNone');

            //Checking if this div contains the active link
            const allLinks = divElement.querySelectorAll('a');
            for (let i = 0; i < allLinks.length; i++) {
                const splitArr = allLinks[i].href.split('=');
                if (splitArr.length > 1 && splitArr[1] === pageId) {
                    imageElement.src = ArrowDown;
                    divElement.classList.remove('displayNone');
                    break;
                }
            }

            //Adding arrow icon to the p tags
            spanElement.appendChild(imageElement);
            tag.appendChild(spanElement);
        }
    });
    return nav.innerHTML;
};

export const collapseAndExpandLeftNav = (doc: HTMLDivElement, setLeftNavOpen: Function) => {
    doc
    .querySelectorAll(selectors.headings)
    .forEach((tag, index) => {
        const divElement = doc.querySelectorAll(
            selectors.linksContainer,
        )[index];

        //Adding click listener to the headings
        tag.addEventListener('click', () => {
            divElement.classList.toggle('displayNone');
            const img = divElement.parentElement.children[0].children[0]
                .children[0] as HTMLImageElement;
            img.src = divElement.classList.contains('displayNone')
                ? ArrowForward
                : ArrowDown;
        });

        //Adding click listener to close left nav when in mobile resolution
        doc
            .querySelectorAll(
                selectors.links,
            )
            .forEach((link) => {
                link.addEventListener('click', () => {
                    setLeftNavOpen(false);
                });
            });
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
