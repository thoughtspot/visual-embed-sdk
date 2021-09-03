import React from "react";
import { Button, Space, notification, Spin, Modal } from "antd";
import qs from "query-string";
import {
  init,
  AuthType,
  EmbedEvent,
  AppEmbed,
  Page,
} from "@thoughtspot/visual-embed-sdk";

import { getDataForColumnName } from "./FullApp.util";
import "./FullApp.css";

const queryParams = qs.parse(window.location.search);
const customHost: string = queryParams.host as string;

const thoughtSpotHost = !!customHost
  ? `https://${customHost}`
  : "https://internal-tscloudwaftest2-1170995390.us-west-2.elb.amazonaws.com/";

init({
  thoughtSpotHost,
  authType: AuthType.None,
  getAuthToken: async () => {
    return fetch(
      "http://ts-everywhere-auth.thoughtspot.com:5000/gettoken/tsadmin"
    ).then((r) => r.text());
  },
  username: "tsadmin",
});

export const FullApp = () => {
  const embedRef = React.useRef(null);
  const [isEmbedLoading, setIsEmbedLoading] = React.useState(true);

  React.useEffect(() => {
    if (embedRef !== null) {
      embedRef!.current.innerHTML = "";
    }

    const tsFullApp = new AppEmbed("#tsEmbed", {
      frameParams: {},
      /*param-start-showNavBar*//*param-end-showNavBar*/
      /*param-start-disableProfileAndHelp*//*param-end-disableProfileAndHelp*/
      /*param-start-navigateToUrl*//*param-end-navigateToUrl*/
      /*param-start-pageId*/
      pageId: Page.Home,
      /*param-end-pageId*/
      /*param-start-modifyActions*//*param-end-modifyActions*/
      /*param-start-runtimeFilters*//*param-end-runtimeFilters*/
    });

    tsFullApp
      .on(EmbedEvent.Init, () => setIsEmbedLoading(true))
      .on(EmbedEvent.Load, () => setIsEmbedLoading(false))
      .render();
  }, []);
  return (
    <div className="fullApp">
      {isEmbedLoading ? (
        <div className="embedSpinner">
          <Spin size="large" />
        </div>
      ) : (
          ""
        )}
      <div className="tsEmbed" ref={embedRef} id="tsEmbed"></div>
    </div>
  );
};
