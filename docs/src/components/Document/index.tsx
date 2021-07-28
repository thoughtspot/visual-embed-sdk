import React, { useEffect } from 'react';
import './index.scss';
import { customizeDocContent, addScrollListener } from './helper';
import Footer from '../Footer';

const Document = (props: {
    docTitle: string;
    docContent: string;
    isPublicSiteOpen: boolean;
    shouldShowRightNav: boolean
}) => {
    useEffect(() => {
        customizeDocContent();
    }, [props.docContent]);

    useEffect(() => {
        addScrollListener();
    }, []);

    return (
        <div
            className="documentWrapper"
            style={{
                width: !props.shouldShowRightNav ? '100%' : null,
            }}
        >
            <div
                id={props.docTitle}
                dangerouslySetInnerHTML={{
                    __html: props.docContent,
                }}
            />
            {props.isPublicSiteOpen && <Footer />}
        </div >
    );
};

export default Document;
