import React, { useEffect, useState } from 'react';
import './index.scss';

const Docmap = (props: { docContent: string }) => {

    const [toc, setToc] = useState('');

    useEffect(() => {
        const doc = document.createElement('div');
        doc.innerHTML = props.docContent;
        const tocEl = doc.querySelector('#toc');
        if (tocEl) {
            setToc(tocEl.innerHTML);
        }
    }, [props.docContent]);

    return (
        <div className="docmapLinks">
            <p className="tocTitle">On this page</p>
            <div
                dangerouslySetInnerHTML={{ __html: toc }}
            />
        </div>
    );
};

export default Docmap;
