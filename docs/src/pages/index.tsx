import React, { useState, useEffect } from 'react';
import { useStaticQuery, graphql, navigate } from 'gatsby';
import queryStringParser from '../utils/app-utils';
import passThroughHandler from '../utils/doc-utils';
import Docmap from '../components/Docmap';
import Document from '../components/Document';
import LeftSidebar from '../components/LeftSidebar';
import '../assets/styles/index.scss';
import {
    DOC_NAV_PAGE_ID,
    TS_HOST_PARAM,
    TS_PAGE_ID_PARAM,
    NAV_PREFIX,
} from '../configs/doc-configs';

// markup
const IndexPage = ({ location }) => {
    const [params, setParams] = useState({
        [TS_HOST_PARAM]: '',
        [TS_PAGE_ID_PARAM]: '',
        [NAV_PREFIX]: '',
    });
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');
    const [navTitle, setNavTitle] = useState('');
    const [navContent, setNavContent] = useState('');

    useEffect(() => {
        setParams(queryStringParser(location.search));
    }, []);

    useEffect(() => {
        // fetch navigation page index
        const navIndex = edges.findIndex(
            (i) => i.node.pageAttributes[TS_PAGE_ID_PARAM] === DOC_NAV_PAGE_ID,
        );

        // get & set left navigation title
        setNavTitle(edges[navIndex].node.pageAttributes.title);

        // get & set left navigation area content with dynamic link creation
        setNavContent(passThroughHandler(edges[navIndex].node.html, params));

        // check if url query param is having pageid or not
        if (params[TS_PAGE_ID_PARAM]) {
            // fetch edge id for specified pageid in the url
            const edgeIndex = edges.findIndex(
                (i) =>
                    i.node.pageAttributes[TS_PAGE_ID_PARAM] ===
                    params[TS_PAGE_ID_PARAM],
            );

            // check if we have corresponding document to serve if not redirect to 404
            if (edgeIndex > -1) {
                // get and set page title
                setDocTitle(
                    edges[edgeIndex].node.document.title ||
                        edges[edgeIndex].node.pageAttributes.title,
                );

                // get and set doc page content with dynamic data replaced
                setDocContent(
                    passThroughHandler(edges[edgeIndex].node.html, params),
                );
            } else {
                // pageid not found redirect
                navigate('/404');
            }
        }
    }, [params]);

    // fetch adoc translated doc edges using graphql
    const {
        allAsciidoc: { edges },
    } = useStaticQuery(
        graphql`
            query {
                allAsciidoc(sort: { fields: [document___title], order: ASC }) {
                    edges {
                        node {
                            document {
                                title
                            }
                            pageAttributes {
                                pageid
                                title
                                description
                            }
                            html
                        }
                    }
                }
            }
        `,
    );

    return (
        <>
            <main>
                <LeftSidebar navTitle={navTitle} navContent={navContent} />
                <div className="documentBody">
                    <div className="introWrapper">
                        <Document docTitle={docTitle} docContent={docContent} />
                        <Docmap docContent={docContent} />
                    </div>
                </div>
            </main>
        </>
    );
};

export default IndexPage;
