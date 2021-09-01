import { fetchChild, getBreadcrumsPath, passThroughHandler } from './doc-utils';

describe('test cases for doc-utils', () => {

    const breadCrumbData = [
        {
            "name": "Home",
            "href": "?pageid=introduction"
        },
        {
            "name": "What’s new",
            "href": "?pageid=whats-new"
        },
        {
            "name": "ThoughtSpot Everywhere",
            "href": "?pageid=embed-analytics",
            "children": [
                {
                    "name": "Integration guidelines",
                    "href": "?pageid=integration-guidelines"
                },
                {
                    "name": "ThoughtSpot Developer portal",
                    "href": "?pageid=spotdev-portal"
                },
                {
                    "name": "Developer Playground",
                    "href": "?pageid=dev-playground"
                }
            ]
        },
        {
            "name": "Authentication and security",
            "href": "?pageid=auth-overview",
            "children": [
                {
                    "name": "Developer access",
                    "href": "?pageid=developer-access"
                },
                {
                    "name": "Security settings",
                    "href": "?pageid=security-settings"
                },
                {
                    "name": "SAML SSO authentication",
                    "href": "?pageid=saml-sso"
                },
                {
                    "name": "Trusted authentication",
                    "href": "?pageid=trusted-auth"
                },
                {
                    "name": "Custom domain configuration",
                    "href": "?pageid=custom-domain-config"
                },
                {
                    "name": "Browser settings for embedding",
                    "href": "?pageid=browser-settings"
                },
                {
                    "name": "Access control and data security",
                    "href": "?pageid=embed-object-access"
                }
            ]
        },
        {
            "name": "Visual Embed SDK",
            "href": "?pageid=visual-embed-sdk",
            "children": [
                {
                    "name": "Get started",
                    "href": "?pageid=getting-started"
                },
                {
                    "name": "Embed user authentication",
                    "href": "?pageid=embed-auth"
                },
                {
                    "name": "Embed search",
                    "href": "?pageid=search-embed"
                },
                {
                    "name": "Embed a pinboard",
                    "href": "?pageid=embed-pinboard"
                },
                {
                    "name": "Embed a visualization",
                    "href": "?pageid=embed-a-viz"
                },
                {
                    "name": "Embed full application",
                    "href": "?pageid=full-embed"
                },
                {
                    "name": "Disable or hide menu actions",
                    "href": "?pageid=action-config"
                },
                {
                    "name": "Visual Embed SDK Reference",
                    "href": "?pageid=js-reference"
                }
            ]
        },
        {
            "name": "Custom actions",
            "href": "?pageid=custom-action-intro",
            "children": [
                {
                    "name": "Custom actions page",
                    "href": "?pageid=customize-actions"
                },
                {
                    "name": "Configure a URL action",
                    "href": "?pageid=custom-action-url"
                },
                {
                    "name": "Configure a callback action",
                    "href": "?pageid=custom-action-callback"
                },
                {
                    "name": "Add a custom action to a visualization",
                    "href": "?pageid=add-action-viz"
                },
                {
                    "name": "Add custom actions to a worksheet",
                    "href": "?pageid=add-action-worksheet"
                },
                {
                    "name": "Callback custom action example",
                    "href": "?pageid=push-data"
                },
                {
                    "name": "Custom action response payload",
                    "href": "?pageid=custom-action-payload"
                }
            ]
        },
        {
            "name": "Customization and rebranding",
            "href": "?pageid=customization-intro",
            "children": [
                {
                    "name": "Customize layout and styles",
                    "href": "?pageid=customize-style"
                },
                {
                    "name": "Customize links",
                    "href": "?pageid=customize-links"
                },
                {
                    "name": "Customize onboarding settings",
                    "href": "?pageid=customize-emails"
                }
            ]
        },
        {
            "name": "Runtime filters",
            "href": "?pageid=runtime-filters"
        },
        {
            "name": "REST API fundamentals",
            "href": "?pageid=rest-apis",
            "children": [
                {
                    "name": "Get started",
                    "href": "?pageid=rest-api-getstarted"
                },
                {
                    "name": "Authentication",
                    "href": "?pageid=api-auth-session"
                },
                {
                    "name": "Manage users and user groups",
                    "href": "?pageid=api-user-management"
                },
                {
                    "name": "Embed data using REST APIs",
                    "href": "?pageid=embed-data-restapi"
                },
                {
                    "name": "Paginate API response",
                    "href": "?pageid=rest-api-pagination"
                }
            ]
        },
        {
            "name": "REST API Reference",
            "href": "?pageid=rest-api-reference",
            "children": [
                {
                    "name": "User APIs",
                    "href": "?pageid=user-api"
                },
                {
                    "name": "Group APIs",
                    "href": "?pageid=group-api"
                },
                {
                    "name": "Session APIs",
                    "href": "?pageid=session-api"
                },
                {
                    "name": "Data connection APIs",
                    "href": "?pageid=connection-api"
                },
                {
                    "name": "Metadata APIs",
                    "href": "?pageid=metadata-api"
                },
                {
                    "name": "Admin APIs",
                    "href": "?pageid=admin-api"
                },
                {
                    "name": "TML APIs",
                    "href": "?pageid=tml-api"
                },
                {
                    "name": "Dependent objects APIs",
                    "href": "?pageid=dependent-objects-api"
                },
                {
                    "name": "Search data API",
                    "href": "?pageid=search-data-api"
                },
                {
                    "name": "Pinboard data API",
                    "href": "?pageid=pinboard-api"
                },
                {
                    "name": "Pinboard Export API",
                    "href": "?pageid=pinboard-export-api"
                },
                {
                    "name": "Security APIs",
                    "href": "?pageid=security-api"
                },
                {
                    "name": "Log streaming service API",
                    "href": "?pageid=logs-api"
                }
            ]
        },
        {
            "name": "Code samples",
            "href": "?pageid=code-samples"
        },
        {
            "name": "Resources",
            "children": [
                {
                    "name": "Playground",
                    "href": "https://try-everywhere.thoughtspot.cloud/v2/#/everywhere/playground/search"
                },
                {
                    "name": "REST API Explorer (Requires login)",
                    "href": "https://try-everywhere.thoughtspot.cloud/external/swagger"
                },
                {
                    "name": "ThoughtSpot Developers",
                    "href": "https://developers.thoughtspot.com"
                },
                {
                    "name": "Community",
                    "href": "https://community.thoughtspot.com/customers/s/"
                },
                {
                    "name": "Product Documentation",
                    "href": "https://cloud-docs.thoughtspot.com"
                }
            ]
        }
    ];

    const pageId = 'spotdev-portal';

    it('should returns name and href of fetched child', () => {
        const child = fetchChild('<ul class="navSection"><li><span><a name="test1" href="#">test1</a><span></li></ul><ul class="navSection"><li><span><a name="test2" href="#">test2</a><span></li></ul>');
        expect(child).toStrictEqual([{ name: 'test1', href: '#' }, { name: 'test2', href: '#' }])
    });

    it('should returns blank array if child is not present', () => {
        const child = fetchChild('');
        expect(child).toStrictEqual([])
    })

    it('should get breadcrumb path', () => {
        const breadcrumbPath = getBreadcrumsPath(breadCrumbData, pageId);
        expect(breadcrumbPath).toStrictEqual([{ "href": "?pageid=embed-analytics", "name": "ThoughtSpot Everywhere" }, { "href": null, "name": "ThoughtSpot Developer portal" }]);
    })

    it('should pass through html correctly', () => {
        const result = passThroughHandler('<div>{{test}}</div>', { testKey: 'testValue' });
        expect(result).toStrictEqual('<div>{{test}}</div>')
    })

})