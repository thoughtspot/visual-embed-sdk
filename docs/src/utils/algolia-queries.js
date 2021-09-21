const config = require('../configs/doc-configs');
const { htmlToText } = require('html-to-text');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Pages = `Pages`

const getPathPrefix = () => {
  return 'docs';
};

const getPath = (path) =>
    getPathPrefix() ? `${path}/${getPathPrefix()}` : path;

const stripLinks = (text) => {
  if (text) {
      const re = /<a\s.*?href=[\"\'](.*?)[\"\']*?>(.*?)<\/a>/g;
      const str = text;
      const subst = '$2';
      const result = str.replace(re, subst);
      return result;
  }
  return '';
};

const getTextFromHtml = (html) =>
  htmlToText(stripLinks(html)).replace(/\r?\n|\r/g, ' ');

const pageQuery = `
query {
  allAsciidoc(sort: { fields: [document___title], order: ASC }) {
      edges {
          node {
              id
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
  allFile(filter: {sourceInstanceName: {eq: "htmlFiles"}}) {
    edges {
        node {
            id
            extension
            dir
            name
            relativePath
            childHtmlRehype {
              html
              htmlAst
            }
        }
    }
  }
}
`

const pageToAlgoliaRecordForASCII = (ele, type , node) => {
    const pageid = node.pageAttributes.pageid;
    let sectionId,sectionTitle;
    if(type === 'section') {
        sectionId = ele.querySelector('h2').id;
        sectionTitle = ele.querySelector('h2').innerHTML;
    } else {
        sectionId = type;
        sectionTitle = node.document.title;
    }
    return {
        objectID: node.id + sectionId,
        sectionId,
        sectionTitle,
        body: ele && getTextFromHtml(ele.innerHTML),
        pageid,
        type: 'ASCII',
        title: node.document.title,
    }
}

const pageToAlgoliaRecordForTypedoc = (node) => {
    const pageid = node.name;
    const body = node && node.childHtmlRehype? getTextFromHtml(
        node.childHtmlRehype.html,
    ): '';
    return {
        objectID: node.id,
        body,
        pageid,
        typedoc: true,
        type: node.extension,
        title: node.childHtmlRehype.htmlAst.children.find(
            (children) =>
                children.tagName === 'title',
        ).children[0].value,
        link: `${getPath(config.DOC_REPO_NAME)}/${
            config.TYPE_DOC_PREFIX
        }/${node.relativePath}`,
    };
}

const queries = [
  {
    query: pageQuery,
    transformer: ({ data }) => {
      return [
        ...data.allAsciidoc.edges
            .filter(
                (edge) =>
                    edge.node.pageAttributes.pageid &&
                    edge.node.pageAttributes.pageid !== 'nav',
            )
            .reduce((acc,edge) => {
                const newDiv = new JSDOM(`<div>${edge.node.html}</div>`).window.document;
                const preambleEle = newDiv.querySelector('#preamble');
                const preamble = pageToAlgoliaRecordForASCII(preambleEle, 'preamble',edge.node);
                const sections = Array.prototype.map.call(newDiv.querySelectorAll('.sect1'),(sect) => 
                    pageToAlgoliaRecordForASCII(sect,'section',edge.node)
                );
                return [...acc,...sections, preamble];
            },[]),
        ...data.allFile.edges
            .filter((edge) => edge.node.extension === 'html')
            .map((edge) => {
                return edge && pageToAlgoliaRecordForTypedoc(edge.node);
            }),
      ];
    },
    indexName: Pages,
    settings: { attributesToSnippet: ['body:15',
    'title'],
    highlightPreTag: '<em style="color:blue;">',
    highlightPostTag: '</em>'
  },
  },
]

module.exports = queries