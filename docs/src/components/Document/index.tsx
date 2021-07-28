import React, { useEffect } from 'react';
import './index.scss';
import { customizeDocContent, addScrollListener } from './helper';
import Footer from '../Footer';

const Document = (props: {
    docTitle: string;
    docContent: string;
    isPublicSiteOpen: boolean;
}) => {
    useEffect(() => {
        customizeDocContent();
    }, [props.docContent]);

    useEffect(() => {
        addScrollListener();
    }, []);

    return (
        <div className="documentWrapper">
            <div
                id={props.docTitle}
                className="documentView"
                dangerouslySetInnerHTML={{
                    __html: props.docContent,
                }}
            />
            {props.isPublicSiteOpen && <Footer />}
        </div>
    );
};

export default Document;
