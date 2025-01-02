import { AuthType, CustomisationsInterface } from 'src/types';

export interface WebViewConfig {
  thoughtSpotHost: string;
  authType: AuthType;
  liveboardId: string;
  username?: string;
  password?: string;
  autoAttachWebViewHandler?:string;
  getAuthToken: () => Promise<string>;
  handleMessage?: (event: any) => void;
  customizations?: CustomisationsInterface;
}
