import React from "react";
import { Button, Space, notification, Spin, Modal } from "antd";
import qs from "query-string";
import {
  init,
  SearchEmbed,
  AuthType,
  EmbedEvent,
} from "@thoughtspot/visual-embed-sdk";

import { getDataForColumnName } from "./Search.util";
import "./Search.css";

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

export const Search = () => {
  const embedRef = React.useRef(null);
  const [isEmbedLoading, setIsEmbedLoading] = React.useState(true);

  React.useEffect(() => {
    if (embedRef !== null) {
      embedRef!.current.innerHTML = "";
    }

    const tsSearch = new SearchEmbed("#tsEmbed", {
      frameParams: {},
    });
    tsSearch
      .on(EmbedEvent.Init, () => setIsEmbedLoading(true))
      .on(EmbedEvent.Load, () => setIsEmbedLoading(false))
      .on(EmbedEvent.CustomAction, (payload: any) => {
        const data = payload.data;
        if (data.id === "send-survey") {
          const recipients = getDataForColumnName(
            data.columnsAndData,
            "email address"
          );
        }
      })
      .render();
  }, []);
  return (
    <div className="feedbackAnalysis">
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
