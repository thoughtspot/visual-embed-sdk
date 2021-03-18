import React, { useState, useEffect } from 'react';
import { useStaticQuery, graphql, navigate } from 'gatsby';
import { useResizeDetector } from 'react-resize-detector';
import { useFlexSearch } from 'react-use-flexsearch';
import queryStringParser from '../utils/app-utils';
import passThroughHandler from '../utils/doc-utils';
import Docmap from '../components/Docmap';
import Document from '../components/Document';
import Search from '../components/Search';
import LeftSidebar from '../components/LeftSidebar';
import '../assets/styles/index.scss';
import {
    DOC_NAV_PAGE_ID,
    TS_HOST_PARAM,
    TS_ORIGIN_PARAM,
    TS_PAGE_ID_PARAM,
    NAV_PREFIX,
    NOT_FOUND_PAGE_ID,
} from '../configs/doc-configs';
import {
    LEFT_NAV_WIDTH_DESKTOP,
    MAX_MOBILE_RESOLUTION,
    LEFT_NAV_WIDTH_MOBILE,
} from '../constants/uiConstants';

// markup
const IndexPage = ({ location }) => {
    const { width, ref } = useResizeDetector();

    const [params, setParams] = useState({
        [TS_HOST_PARAM]: '',
        [TS_ORIGIN_PARAM]: '',
        [TS_PAGE_ID_PARAM]: '',
        [NAV_PREFIX]: '',
    });
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');
    const [navTitle, setNavTitle] = useState('');
    const [navContent, setNavContent] = useState('');
    const [backLink, setBackLink] = useState('');
    const [leftNavWidth, setLeftNavWidth] = useState(
        width > MAX_MOBILE_RESOLUTION
            ? LEFT_NAV_WIDTH_DESKTOP
            : LEFT_NAV_WIDTH_MOBILE,
    );
    const [query, updateQuery] = useState('');
    const [innW, setinnW] = useState(0);
    let Wheight;
    let Wwidth;
    if (typeof window !== `undefined`) {
        Wheight = window.innerHeight;
        Wwidth = window.innerWidth;
    }
    const [dimensions, setDimensions] = useState({
        windowHeight: Wheight,
        windowWidth: Wwidth,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth,
            });
        };
        window.addEventListener(`resize`, handleResize);
        // Remove the event listener if resizing stopped.
        return () => window.removeEventListener(`resize`, handleResize);
    }, []);

    useEffect(() => {
        if (dimensions.windowWidth > 1036) {
            setinnW(dimensions.windowWidth);
        } else {
            setinnW(dimensions.windowWidth + 50);
        }
    }, [dimensions.windowWidth]);

    useEffect(() => {
        const paramObj = queryStringParser(location.search);
        edges.map((e) => {
            paramObj[e.node.parent.name] =
                e.node.pageAttributes.pageid || NOT_FOUND_PAGE_ID;
        });
        setParams({ ...paramObj });
    }, [location.search]);

    const setPageContent = (pageid: string = NOT_FOUND_PAGE_ID) => {
        // check if url query param is having pageid or not
        if (pageid) {
            // fetch edge id for specified pageid in the url
            const edgeIndex = edges.findIndex(
                (i) => i.node.pageAttributes[TS_PAGE_ID_PARAM] === pageid,
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
                setPageContent(NOT_FOUND_PAGE_ID);
            }
        }
    };
    useEffect(() => {
        // fetch navigation page index
        const navIndex = edges.findIndex(
            (i) => i.node.pageAttributes[TS_PAGE_ID_PARAM] === DOC_NAV_PAGE_ID,
        );

        // get & set left navigation title
        setNavTitle(edges[navIndex].node.pageAttributes.title);

        // get & set left navigation area content with dynamic link creation
        setNavContent(passThroughHandler(edges[navIndex].node.html, params));

        // get & set left navigation 'SpotDev Home' button url
        setBackLink(params[TS_ORIGIN_PARAM]);

        // set page title and content based on pageid
        setPageContent(params[TS_PAGE_ID_PARAM]);
    }, [params]);

    // fetch adoc translated doc edges using graphql
    const {
        allAsciidoc: { edges },
        localSearchPages: { index, store },
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
                            parent {
                                ... on File {
                                    name
                                }
                            }
                            html
                        }
                    }
                }
                localSearchPages {
                    index
                    store
                }
            }
        `,
    );

    const results = useFlexSearch(query, index, store).reduce((acc, cur) => {
        if (!acc.some((data) => data.pageid === cur.pageid)) {
            acc.push(cur);
        }
        return acc;
    }, []);

    const optionSelected = (pageid: string) => {
        updateQuery('');
        navigate(pageid);
    };

    return (
        <>
            <main ref={ref as React.RefObject<HTMLDivElement>}>
                <LeftSidebar
                    navTitle={navTitle}
                    navContent={navContent}
                    backLink={backLink}
                    docWidth={width}
                    handleLeftNavChange={setLeftNavWidth}
                    location={location}
                />
                <div
                    className="documentBody"
                    style={{
                        width: `${width - leftNavWidth}px`,
                        maxWidth: `${innW - 321}px`,
                    }}
                >
                    <Search
                        value={query}
                        onChange={(e: React.FormEvent<HTMLInputElement>) =>
                            updateQuery((e.target as HTMLInputElement).value)
                        }
                        options={results}
                        optionSelected={optionSelected}
                    />

                    <div className="introWrapper">
                        <Document docTitle={docTitle} docContent={docContent} />
                        <Docmap
                            docContent={docContent}
                            location={location}
                            options={results}
                        />
                    </div>
                </div>
            </main>
        </>
    );
};

export default IndexPage;
