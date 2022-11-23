import React from 'react';
import TSLogo from '../../assets/svg/ts-logo-white-developer.svg';
import t from '../../utils/lang-utils';
// import Dropdown from '../Dropdown';
import './index.scss';

const Header = (props: { location: Location }) => {
		const headerLinks = [{
            	name: 'CodeSpot',
            	href: 'https://developers.thoughtspot.com/codespot/'
            },
 		    {
 				name: 'Playground',
 				href: 'https://try-everywhere.thoughtspot.cloud/v2/#/everywhere'
 			},
			{
				name: 'Product Guides',
				href: 'https://docs.thoughtspot.com/'
			},
			{
				name: 'Community',
				href: 'https://community.thoughtspot.com/customers/s/topic/0TO3n000000erVyGAI/developers',
			},
		];

		const headerLinkSelf = [{
                        name: 'APIs and SDK',
                        href: '?pageid=apis-sdk'
                    },
        ];


    return (
        <header>
            <section className="containerWrapper">
                <div className="headerWrapper">
                    <div>
                        <h2 className="m-0 d-inline-block logo">
                            <a href="?pageid=introduction" title={t('TS_LOGO_ALT_TEXT')}>
                                <img
                                    src={TSLogo}
                                    alt={t('TS_LOGO_ALT_TEXT')}
                                    className="thoughtspotLogo"
                                />
                            </a>
                        </h2>

                  <div className="d-inline-block headerLink">
                            {headerLinkSelf.map(({ name, href }) => (
                                <a href={href}>
                                    {name}
                                </a>
                            ))}

                    </div>
                        <div className="d-inline-block headerLink">
                            {headerLinks.map(({ name, href }) => (
                                <a href={href} target="_blank">
                                    {name}
                                </a>
                            ))}

                        </div>
                    </div>
                    {/*  <Dropdown location={props.location} /> */}
                </div>
            </section>
        </header>
    );
};

export default Header;
