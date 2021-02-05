import React, { useState, useEffect } from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import queryStringParser from '../utils/app-utils';
import passThroughHandler from '../utils/doc-utils';
import Docmap from '../components/Docmap';
import Document from '../components/Document';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import Search from '../components/Search';
import '../assets/styles/index.scss';

// markup
const Doc2Page = ({ location }) => {
    const [params, setParams] = useState({});
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');

    useEffect(() => {
        setParams(queryStringParser(location.search));
    }, []);

    useEffect(() => {
        setDocTitle(
            edges[1].node.document.title || edges[1].node.document.main,
        );
        setDocContent(passThroughHandler(edges[1].node.html, params));
    }, [params]);

    const {
        allAsciidoc: { edges },
    } = useStaticQuery(
        graphql`
            query {
                allAsciidoc(sort: { fields: [document___title], order: ASC }) {
                    edges {
                        node {
                            id
                            document {
                                title
                                subtitle
                                main
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
            <Header />
            <main>
                <LeftSidebar />
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

export default Doc2Page;
