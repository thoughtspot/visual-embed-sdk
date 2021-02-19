import React, { useEffect, useState } from 'react';
import './index.scss';

const Docmap = (props: { docContent: string, location }) => {
    const [toc, setToc] = useState('');

    useEffect(() => {
        // GraphQL doesn't provide any seperate html for Table of Content. It is included in the document itself.
        // To extract the TOC from document, we first create a temporary element to set the document as it's innerHTML.
        // Them we search for TOC using querySelector on the temporary element and then set the obtained TOC to display in the UI.
        const doc = document.createElement('div');
        doc.innerHTML = props.docContent;
        const tocEl = doc.querySelector('#toc');
        if (tocEl) {
            setToc(tocEl.innerHTML);
        } else {
            setToc('');
        }
    }, [props.docContent]);

    useEffect(() => {
        const href = location.hash;
        if (href) {
            toggleActiveClass(href);
        }
    }, [location.hash]);

    const toggleActiveClass = (href) => {
        document.querySelectorAll(".docmapLinks a").forEach((tag) => {
            if (tag.getAttribute('href') === href) {
                tag.classList.add('activeTag');
            } else {
                if (tag.classList.contains('activeTag')) {
                    tag.classList.remove('activeTag');
                }
            }
        });
    };

    return (
        toc !== '' && (
            <div className="docmapLinks">
                <p className="tocTitle">On this page</p>
                <div dangerouslySetInnerHTML={{ __html: toc }} />
            </div>
        )
    );
};

export default Docmap;
