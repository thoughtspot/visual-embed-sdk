const asciidoc = require(`asciidoctor`)();
const config = require('./docs/src/configs/doc-configs');

class CustomDocConverter {
    constructor() {
        this.baseConverter = asciidoc.Html5Converter.$new();
    }

    convert(node, transform) {
        // checking anchor node type
        if (node.getNodeName() === 'inline_anchor') {
            // get anchor target set inside adoc file
            let target = node.getTarget();

            if (
                !target.includes(`{{${config.NAV_PREFIX}}}`) &&
                !target.includes('www.') &&
                !target.startsWith('http')
            ) {
                // check if link is for typedoc documents or not
                if (target.includes(config.TYPE_DOC_PREFIX)) {
                    return `<a href="${
                        config.DOC_REPO_NAME + target
                    }">${node.getText()}</a>`;
                } else if (!target.startsWith('#')) {
                    target = target.substring(
                        target.lastIndexOf(':') + 1,
                        target.lastIndexOf('.html'),
                    );
                    return `<a href="{{${
                        config.NAV_PREFIX
                    }}}={{${target}}}">${node.getText()}</a>`;
                }
            }
        }

        return this.baseConverter.convert(node, transform);
    }
}

module.exports = {
    pathPrefix: config.DOC_REPO_NAME,
    siteMetadata: {
        title: 'tseverywhere-docs',
    },
    plugins: [
        'gatsby-plugin-sass',
        {
            resolve: `gatsby-plugin-page-creator`,
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
            resolve: `gatsby-plugin-intl`,
            options: {
                // language JSON resource path
                path: `${__dirname}/docs/src/intl`,
                // supported language
                languages: ['en'],
                // language file path
                defaultLanguage: 'en',
                // option to redirect to `/en` when connecting `/`
                redirect: true,
            },
        },
        {
            resolve: `gatsby-transformer-asciidoc`,
            options: {
                attributes: {
                    showtitle: true,
                    imagesdir: `/doc-images`,
                },
                fileExtensions: ['ad', 'adoc'],
                converterFactory: CustomDocConverter,
            },
        },
    ],
};
