import React, { useEffect } from 'react';
import './index.scss';
import { customizeDocContent, addScrollListener } from './helper';
import Footer from '../Footer';
import Breadcrums from '../Breadcrums';
import LinkableHeader from '../LinkableHeader';
import { HOME_PAGE_ID } from '../../configs/doc-configs';
import parse, { HTMLReactParserOptions, domToReact, attributesToProps } from 'html-react-parser';

const Document = (props: {
    pageid?: string;
    docTitle: string;
    docContent: string;
    isPublicSiteOpen: boolean;
    shouldShowRightNav: boolean
    breadcrumsData: any;
}) => {
    useEffect(() => {
        customizeDocContent();
    }, [props.docContent]);

    useEffect(() => {
        addScrollListener();
    }, []);

    const options: HTMLReactParserOptions = {
        replace: (domNode: any) => {
            if (domNode.type === 'tag' &&
                ['h2', 'h3', 'h4'].includes(domNode.name) &&
                !domNode.parent?.attribs?.class?.includes('non-link')
            ) {
                const props = attributesToProps(domNode.attribs);
                return (<LinkableHeader {...props} tag={domNode.name} id={domNode.attribs.id}>
                    {domToReact(domNode.children, options)}
                </LinkableHeader>)
            }
        }
    };

    return (
        <div
            className="documentWrapper"
            style={{
                width: !props.shouldShowRightNav ? '100%' : null,
            }}
        >
            {props.pageid !== HOME_PAGE_ID && (
                <Breadcrums
                    breadcrumsData={props.breadcrumsData}
                    pageid={props.pageid}
                />
            )}
            <div
                id={props.docTitle}
                className="documentView"
            >
                {parse(props.docContent, options)}
            </div>
            {props.isPublicSiteOpen && <Footer />}
        </div>
    );
};

export default Document;
