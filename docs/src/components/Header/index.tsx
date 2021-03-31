import React from 'react';
import TSLogo from '../../assets/svg/ts_logo_white.svg';
import './index.scss';

const Header = () => (
    <header>
        <section className="container">
            <div className="headerWrapper">
                <div>
                    <h1 className="m-0">
                        <a href="#" title="logo">
                            <img
                                src={TSLogo}
                                alt="logo"
                                className="thoughtspotLogo"
                            />
                        </a>
                    </h1>
                </div>
            </div>
        </section>
    </header>
);

export default Header;
