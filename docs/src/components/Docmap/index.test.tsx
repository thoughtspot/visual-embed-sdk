import React from 'react';
import { render } from '@testing-library/react';

import Docmap from './index';

const dummyLocation = {
    "pathname": "/en/",
    "search": "?pageid=visual-embed-sdk",
    "hash": "",
    "href": "http://localhost:8000/en/?pageid=visual-embed-sdk",
    "origin": "http://localhost:8000",
    "protocol": "http:",
    "host": "localhost:8000",
    "hostname": "localhost",
    "port": "8000",
    "state": {
        "key": "1629178873455"
    },
    "key": "1629178873455"
};
const docContentHTML = "<h1>Visual Embed SDK</h1>\n<div id=\"toc\" class=\"toc\">\n<div id=\"toctitle\">Table of Contents</div>\n<ul class=\"sectlevel1\">\n<li><a href=\"#_configuration_requirements\">Configuration requirements</a></li>\n<li><a href=\"#_start_embedding\">Start embedding</a></li>\n<li><a href=\"#_useful_resources\">Useful resources</a></li>\n</ul>\n</div>\n<div id=\"preamble\">\n<div class=\"sectionbody\">\n<div class=\"paragraph\">\n<p>The Visual Embed SDK provides a Javascript library to embed ThoughtSpot elements in your host application.</p>\n</div>\n<div class=\"paragraph\">\n<p>You can use the Visual Embed SDK for the following purposes:</p>\n</div>\n<div class=\"ulist\">\n<ul>\n<li>\n<p>Embed specific components of the ThoughtSpot application; for example, search, pinboards, and visualizations.</p>\n</li>\n<li>\n<p>Render full ThoughtSpot application within a host application.</p>\n</li>\n</ul>\n</div>\n</div>\n</div>\n<div class=\"sect1\">\n<h2 id=\"_configuration_requirements\">Configuration requirements</h2>\n<div class=\"sectionbody\">\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p> <h4> Integration guidelines </h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Read the <a href=\"?pageid=integration-guidelines\">integration guidelines</a> to understand the embedding requirements and recommendations.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Security settings </h4> </p>\n</div>\n<div class=\"paragraph\">\n<p>Before you get started, <a href=\"?pageid=security-settings\">add your application domain to the CORS and CSP allowed list</a> and set your application as a trusted host for secure data exchange.</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n<div class=\"sect1\">\n<h2 id=\"_start_embedding\">Start embedding</h2>\n<div class=\"sectionbody\">\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Get Started</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Download the Visual Embed SDK package, set up your application environment, and <a href=\"?pageid=getting-started\">get started with embedding</a>.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Configure authentication method</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Learn how to set up <a href=\"?pageid=saml-sso\">SAML SSO</a> or <a href=\"?pageid=trusted-auth\">trusted authentication service</a>, and <a href=\"?pageid=embed-auth\">configure authentication methods in SDK</a> to authenticate your  application users.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Embed search</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Learn <a href=\"?pageid=search-embed\">how to embed ThoughtSpot search</a> in your application.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Embed a visualization</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Learn how to <a href=\"?pageid=embed-a-viz\">embed a ThoughtSpot visualization</a> in your application.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Embed a pinboard</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Learn how to <a href=\"?pageid={{embed-a-pinboard}}\">render pinboards and apply runtime controls on visualizations</a> embedded in your application.</p>\n</div>\n</div>\n</div>\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"paragraph\">\n<p><h4>Embed full ThoughtSpot experience</h4></p>\n</div>\n<div class=\"paragraph\">\n<p>Learn how to <a href=\"?pageid=full-embed\">embed full ThoughtSpot experience</a> in your application.</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n<div class=\"sect1\">\n<h2 id=\"_useful_resources\">Useful resources</h2>\n<div class=\"sectionbody\">\n<div class=\"openblock div boxDiv boxFullWidth\">\n<div class=\"content\">\n<div class=\"ulist\">\n<ul>\n<li>\n<p><a href=\"/visual-embed-sdk/typedoc/modules.html\" target=\"_blank\">Visual Embed SDK Reference Guide</a></p>\n</li>\n<li>\n<p><a href=\"https://github.com/thoughtspot/visual-embed-sdk#readme\" target=\"_blank\" rel=\"noopener\">ReadMe</a></p>\n</li>\n<li>\n<p><a href=\"https://github.com/thoughtspot/visual-embed-sdk\" target=\"_blank\" rel=\"noopener\">Visual Embed SDK GitHub repository</a></p>\n</li>\n<li>\n<p><a href=\"https://developers.thoughtspot.com/guides\">Visual Embed Tutorials</a></p>\n</li>\n</ul>\n</div>\n</div>\n</div>\n</div>\n</div>";
const docContentHTMLBlank = "";

jest.mock('../../utils/lang-utils', () => (key) => key);

describe('Docmap', () => {
    const docContent = docContentHTML;
    const options = [{}];
    const location = dummyLocation;
    it('should render correctly', () => {
        const { container, getByTestId } = render(<Docmap docContent={docContent} options={options} location={location} />);
        expect(container).toMatchSnapshot();
        expect(getByTestId('toc')).toBeInTheDocument();
    })

    it('should not render toc if docContent is empty', () => {
        const { queryByTestId } = render(<Docmap docContent={docContentHTMLBlank} options={options} location={location} />);
        expect(queryByTestId('toc')).toBeNull();
    })
})