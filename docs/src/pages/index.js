import * as React from 'react';
import t from '../utils/lang-utils';
import './styles/index.scss';

// markup
const IndexPage = () => {
    return (
        <div>
            <header className="header">
                <img src="" alt="logo" className="logo" />
                <input type="text" title="search" className="searchBox" />
            </header>
            <div className="container">
                <div className="leftSidebar">{t('HOME_LEFT_NAVIGATION')}</div>
                <div className="contentArea">{t('HOME_MAIN_CONTENT')}</div>
                <div className="rightSidebar">{t('HOME_RIGHT_NAVIGATION')}</div>
            </div>
        </div>
    );
};

export default IndexPage;
