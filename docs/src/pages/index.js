import * as React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import t from '../utils/lang-utils';
import './styles/index.scss';

// markup
const IndexPage = () => {
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

    const docTitle =
        edges[0].node.document.title || edges[0].node.document.main;
    const docContent = edges[0].node.html;

    return (
        <div>
            <header className="header">
                <img src="" alt="logo" className="logo" />
                <input type="text" title="search" className="searchBox" />
            </header>
            <div className="container">
                <div className="leftSidebar">{t('HOME_LEFT_NAVIGATION')}</div>
                <div className="contentArea">
                    {/* {t('HOME_MAIN_CONTENT')} */}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: `<b>Title:</b> ${docTitle}`,
                        }}
                    />
                    <b>Document Content:</b>
                    <div
                        className="docContentArea"
                        dangerouslySetInnerHTML={{
                            __html: docContent,
                        }}
                    />
                </div>
                <div className="rightSidebar">{t('HOME_RIGHT_NAVIGATION')}</div>
            </div>
        </div>
    );
};

export default IndexPage;
