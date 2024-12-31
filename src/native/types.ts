import { AuthType, CustomisationsInterface } from 'src/types';

export interface WebViewConfig {
  host: string;
  authType: AuthType;
  liveboardId: string;
  getAuthToken: () => Promise<string>;
  handleMessage?: (event: any) => void;
  customizations?: CustomisationsInterface;
}
