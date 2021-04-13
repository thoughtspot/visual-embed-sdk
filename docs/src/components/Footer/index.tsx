import React from 'react';
import t from '../../utils/lang-utils';
import './index.scss';

const Footer = () => (
    <footer>
        <section className="container">
            <div className="footerWrapper">
                <span>{t('COPYRIGHT_TEXT')}</span>
            </div>
        </section>
    </footer>
);

export default Footer;
