import React from 'react';
import TSLogo from '../../assets/svg/ts-logo-white.svg';
import t from '../../utils/lang-utils';
// import Dropdown from '../Dropdown';
import './index.scss';

const Header = (props: { location: Location }) => {
    const headerLinks = [
        { name: 'Playground', href: 'https://try-everywhere.thoughtspot.cloud/v2/#/everywhere' 
        },
        /*{ name: 'Visual Embed', href: '?pageid=visual-embed-sdk' 
        },
        
        { name: 'REST APIs', href: '?pageid=rest-apis' 
        },*/
        
        {
            name: 'Community',
            href:
                'https://community.thoughtspot.com/customers/s/topic/0TO3n000000erVyGAI/developers',
        },
        { name: 'Support', href: 'https://www.thoughtspot.com/support' },
        { name: 'Help Center', href: 'https://cloud-docs.thoughtspot.com/' },
    ];

    return (
        <header>
            <section className="containerWrapper">
                <div className="headerWrapper">
                    <div>
                        <h2 className="m-0 d-inline-block logo">
                            <a href="#" title={t('TS_LOGO_ALT_TEXT')}>
                                <img
                                    src={TSLogo}
                                    alt={t('TS_LOGO_ALT_TEXT')}
                                    className="thoughtspotLogo"
                                />
                            </a>
                        </h2>
                        <a
                            className="m-0 d-inline-block docsWrapper"
                            href="?pageid=introduction"
                        >
                            {t('DOCS')}
                        </a>
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
