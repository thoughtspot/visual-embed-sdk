import * as React from "react";
import _translation from "../utils/lang-utils";
import "./styles/index.scss";

// markup
const IndexPage = () => {

  return (
    <div>
      <header className="header">
        <img src="" alt="logo" className="logo" />
        <input type="text" title="search" className="searchBox" />
      </header>
      <div className="container">
        <div className="leftSidebar">{_translation("HOME_LEFT_NAVIGATION")}</div>
        <div className="contentArea">{_translation("HOME_MAIN_CONTENT")}</div>
        <div className="rightSidebar">{_translation("HOME_RIGHT_NAVIGATION")}</div>
      </div>
    </div>
  )
}

export default IndexPage
