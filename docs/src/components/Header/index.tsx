import React from 'react';
import TSLogo from '../../assets/svg/ts-logo-white.svg';
import t from '../../utils/lang-utils';
import Dropdown from '../Dropdown';
import './index.scss';

const Header = (props: { location: Location }) => (
    <header>
        <section className="container">
            <div className="headerWrapper">
                <div>
                    <h1 className="m-0">
                        <a href="#" title={t('TS_LOGO_ALT_TEXT')}>
                            <img
                                src={TSLogo}
                                alt={t('TS_LOGO_ALT_TEXT')}
                                className="thoughtspotLogo"
                            />
                        </a>
                    </h1>
                </div>
                <Dropdown location={props.location} />
            </div>
        </section>
    </header>
);

export default Header;
