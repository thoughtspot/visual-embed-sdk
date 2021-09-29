import * as algoliaSearch from './algolia-queries';
import {JSDOM} from 'jsdom';

const typedocNode = {
    name: 'typeDoc Page',
    id: 'fa556896-4e38-5e7a-ab35-a45ee93d58ee',
    childHtmlRehype: {
        html: '<div>typedoc HTML</div>',
        htmlAst: {
            children: [ {
                    tagName: 'title',
                    children: [
                        {
                            value: '@thoughtspot/visual-embed-sdk',
                        }
                    ]
                },  
            ]
        },
    },
    extension: 'html',
    relativePath: 'modules.html',
};

const typedocAlgoliaObj = {
    body: 'typedoc HTML',
    link: '/docs/typedoc/modules.html',
    objectID: 'fa556896-4e38-5e7a-ab35-a45ee93d58ee',
    pageid: 'typeDoc Page',
    title: '@thoughtspot/visual-embed-sdk',
    type: 'html',
    typedoc: true,
};

const htmlForSectionEle = `
<div class="sect1">
    <h2 id="_resource_endpoints">Resource endpoints</h2>
    <div class="sectionbody">
        <p>ThoughtSpot API components or resources are represented by the URI endpoints.</p>
    </div>
</div>`;
const divForSection = new JSDOM(htmlForSectionEle).window.document;
const dummySectionEle = divForSection.querySelector('.sect1');

const htmlForPreambleEle = `
<div id="preamble">
    <div class="sectionbody">
        <p>ThoughtSpot REST APIs let you programmatically create ThoughtSpot objects.</p>
    </div>
</div>
`;
const divForpreamble = new JSDOM(htmlForPreambleEle).window.document;
const dummyPreambleEle = divForpreamble.querySelector('#preamble');

const asciiNode = {
    id: 'fa556896-4e38-5e7a-ab35-a45ee93d58ee',
    pageAttributes: {
        pageid: 'rest-apis',
    },
    document: {
        title: 'About REST APIs',
    },
};

const asciiAlgoliaObj = {
    body: 'ThoughtSpot API components or resources are represented by the URI endpoints.',
    objectID: 'fa556896-4e38-5e7a-ab35-a45ee93d58ee_resource_endpoints',
    pageid: 'rest-apis',
    sectionId: '_resource_endpoints',
    sectionTitle: 'Resource endpoints',
    title: 'About REST APIs',
    type: 'ASCII',
};

const asciiPremableAlgoliaObj = {
    body: 'ThoughtSpot REST APIs let you programmatically create ThoughtSpot objects.',
    objectID: 'fa556896-4e38-5e7a-ab35-a45ee93d58eepreamble',
    pageid: 'rest-apis',
    sectionId: 'preamble',
    sectionTitle: 'About REST APIs',
    title: 'About REST APIs',
    type: 'ASCII',
};

const algoliaTransformerData:any = {
    allAsciidoc: {
        edges: [
            {
                node:   {
                    ...asciiNode,
                    html: htmlForSectionEle,
                },
            },
            {
                node:   {
                    ...asciiNode,
                    html: htmlForPreambleEle,
                }
            }
        ]
    },
    allFile: {
        edges: [{node:typedocNode}],
    }
};
describe('test cases from algolia search', () => {

    it('verify JSON object for typedoc', () => {
        expect(algoliaSearch.pageToAlgoliaRecordForTypedoc(typedocNode)).toStrictEqual(typedocAlgoliaObj);
    });

    it('verify section JSON object for ascii docs', () => {
        expect(algoliaSearch.pageToAlgoliaRecordForASCII(dummySectionEle,'section',asciiNode))
        .toStrictEqual(asciiAlgoliaObj);
    });

    it('verify preable JSON object for ascii docs', () => {
        expect(algoliaSearch.pageToAlgoliaRecordForASCII(dummyPreambleEle,'preamble',asciiNode))
        .toStrictEqual(asciiPremableAlgoliaObj);
    });

    it('verify Algolia transformer data', () => {
        expect(algoliaSearch.queries[0].transformer({data: algoliaTransformerData}))
        .toStrictEqual([
            asciiAlgoliaObj,
            asciiPremableAlgoliaObj,
            typedocAlgoliaObj
        ]);
    });
});