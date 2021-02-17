import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import './index.scss';
import BackButton from '../BackButton';

const LeftSideBar = (props: {
    navTitle: string;
    navContent: string;
    backLink: string;
}) => {

    const [pageid] = useState(location.search.slice(1).split('&')[0]);
    const [navContent, setNavContent] = useState('');
    
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

    return (
        <ResizableBox
            width={310}
            minConstraints={[100, 100]}
            maxConstraints={[310]}
            axis="x"
            style={{ position: 'fixed' }}
            height={window.screen.height}
        >
            <aside>
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
