require("dotenv").config();
const asciidoc = require('asciidoctor')();
const config = require('./docs/src/configs/doc-configs');

const buildEnv = process.env.BUILD_ENV || config.BUILD_ENVS.LOCAL; // Default build env

const getPathPrefix = () => {
    return 'docs';
};

const getPath = (path) =>
    getPathPrefix() ? `${path}/${getPathPrefix()}` : path;

class CustomDocConverter {
    constructor() {
        this.baseConverter = asciidoc.Html5Converter.$new();
    }

    /**
     * Check if inline_anchor target is for transformation or not
     * @param {string} target - inline_anchor target i.e. href
     * @returns {boolean} true if transformation is needed else false
     */
    isTransformLink(target) {
        return (
            !target.includes(`{{${config.NAV_PREFIX}}}`) &&
            !target.includes(`{{${config.PREVIEW_PREFIX}}}`) &&
            !target.includes(`{{${config.TS_HOST_PARAM}}}`) &&
            !target.includes('www.') &&
            !target.startsWith('http')
        );
    }

    /**
     * Convert is used to return html node string based on transform or conditions
     * @param {any} node - The concrete instance of AbstractNode to convert.
     * @param {string} transform - An optional string transform that hints at which transformation should be applied to this node.
     * @returns {string} html node string
     */
    convert(node, transform) {
        // checking anchor node type
        if (node.getNodeName() === 'inline_anchor') {
            let anchorMarkup = '';

            // get anchor target set inside adoc file
            let target = node.getTarget();

            // get anchor attributes
            const attributes = node.getAttributes();
            if (this.isTransformLink(target)) {
                // check if link is for 'Visual Embed SDK' documents or not
                if (target.includes(config.VISUAL_EMBED_SDK_PREFIX)) {
                    anchorMarkup = `${getPath(config.DOC_REPO_NAME)}/${
                        config.TYPE_DOC_PREFIX
                    }${target.replace(
                        `{{${config.VISUAL_EMBED_SDK_PREFIX}}}`,
                        '',
                    )}`;
                } else if (!target.startsWith('#')) {
                    target = target.substring(
                        target.lastIndexOf(':') + 1,
                        target.lastIndexOf('.html'),
                    );

                    anchorMarkup = `{{${config.NAV_PREFIX}}}={{${target}}}`;
                }

                // attribute handling - DO NOT CHANGE ORDER OF IFs
                if (attributes.fragment) {
                    anchorMarkup += `#${attributes.fragment}`;
                }
                anchorMarkup = `href="${anchorMarkup}"`;
                if (attributes.window) {
                    anchorMarkup += ` target="${attributes.window}"`;
                }

                return `<a ${anchorMarkup}>${node.getText()}</a>`;
            }
        }

        return this.baseConverter.convert(node, transform);
    }
}

console.log(getPath(config.DOC_REPO_NAME));
module.exports = {
    pathPrefix: getPath(config.DOC_REPO_NAME),
    siteMetadata: {
        title: 'tseverywhere-docs',
    },
    plugins: [
        'gatsby-plugin-sass',
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/docs/src/pages`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'pages',
                path: `${__dirname}/docs/src/pages/`,
            },
            __key: 'pages',
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'asciidocs',
                path: `${__dirname}/docs/src/asciidocs/`,
            },
            __key: 'asciidocs',
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'common',
                path: `${__dirname}/docs/src/asciidocs/common/`,
            },
            __key: 'asciidocs_common',
        },
        {
            resolve: 'gatsby-plugin-intl',
            options: {
                // language JSON resource path
                path: `${__dirname}/docs/src/intl`,
                // supported language
                languages: ['en'],
                // language file path
                defaultLanguage: 'en',
                // option to redirect to `/en` when connecting `/`
                redirect: false,
            },
        },
        {
            resolve: 'gatsby-transformer-asciidoc',
            options: {
                safe: 'server',
                attributes: {
                    showtitle: true,
                    imagesdir: '/doc-images',
                    path: `${__dirname}/docs/src/asciidocs/partials`,
                },
                fileExtensions: ['ad', 'adoc'],
                converterFactory: CustomDocConverter,
            },
        },
        {
            resolve: 'gatsby-transformer-rehype',
            options: {
                mediaType: 'text/html',
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'htmlFiles',
                path: `${__dirname}/static/typedoc/`,
            },
            __key: 'htmlFiles',
        },
        'gatsby-plugin-catch-links',
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: 'ThoughtSpot Software Documentation',
                short_name: 'Documentation',
                icon: `${__dirname}/docs/src/assets/icons/favicon.svg`,
            },
        },
        'gatsby-plugin-output',
        {
            resolve: `gatsby-plugin-algolia`,
            options: {
              appId: process.env.GATSBY_ALGOLIA_APP_ID,
              apiKey: process.env.ALGOLIA_ADMIN_KEY,
              queries: require(`${__dirname}/docs/src/utils/algolia-queries`).queries
            },
        }
    ],
};
