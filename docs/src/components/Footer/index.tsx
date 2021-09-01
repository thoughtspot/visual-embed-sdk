import React from 'react';
import t from '../../utils/lang-utils';
import './index.scss';

const Footer = () => (
    <footer>
        <section className="containerWrapper">
            <div className="footerWrapper">
                <span data-testid="footer-text">{t('COPYRIGHT_TEXT')}</span>
            </div>
        </section>
    </footer>
);

export default Footer;
