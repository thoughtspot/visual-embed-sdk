import React, { useState, useEffect } from 'react';
import { useStaticQuery, graphql, navigate } from 'gatsby';
import queryStringParser from '../utils/app-utils';
import passThroughHandler from '../utils/doc-utils';
import Docmap from '../components/Docmap';
import Document from '../components/Document';
import LeftSidebar from '../components/LeftSidebar';
import Search from '../components/Search';
import '../assets/styles/index.scss';
import { DOC_NAV_PAGE_ID } from '../configs/doc-configs';

// markup
const IndexPage = ({ location }) => {
    const [params, setParams] = useState({ tshost: '', pageid: '' });
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');
    const [navTitle, setNavTitle] = useState('');
    const [navContent, setNavContent] = useState('');

    useEffect(() => {
        setParams(queryStringParser(location.search));
    }, []);

    useEffect(() => {
        const navIndex = edges.findIndex(
            (i) => i.node.pageAttributes.pageid === DOC_NAV_PAGE_ID,
        );
        setNavTitle(edges[navIndex].node.pageAttributes.title);
        setNavContent(passThroughHandler(edges[navIndex].node.html, params));

        if (params.pageid) {
            const edgeIndex = edges.findIndex(
                (i) => i.node.pageAttributes.pageid === params.pageid,
            );

            if (edgeIndex > -1) {
                setDocTitle(
                    edges[edgeIndex].node.document.title ||
                        edges[edgeIndex].node.pageAttributes.title,
                );
                setDocContent(
                    passThroughHandler(edges[edgeIndex].node.html, params),
                );
            } else {
                navigate('/404');
            }
        }
    }, [params]);

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
                    <Search />
                    <div className="introWrapper">
                        <Document docTitle={docTitle} docContent={docContent} />
                        <Docmap />
                    </div>
                </div>
            </main>
        </>
    );
};

export default IndexPage;
