import { useEffect, useState } from "preact/hooks";
import SpotifyWebApi from "spotify-web-api-js";

export function useSpotifyAuth(config: {
  scopes: string[];
  clientId: string;
  redirectUri: string;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState<SpotifyAuthToken | null>(null);
  const [client, setClient] = useState<SpotifyWebApi.SpotifyWebApiJs>(
    new SpotifyWebApi()
  );
  useEffect(() => {
    const parts = window.location.hash.substring(1).split("&");
    if (parts.length === 3) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const time = new Date();
      time.setSeconds(time.getSeconds() + parseInt(params.get("expires_in")!));
      const token: SpotifyAuthToken = {
        accessToken: params.get("access_token")!,
        tokenType: params.get("token_type")!,
        expires: time,
      };
      setToken(token);
      setLoggedIn(true);
      client.setAccessToken(token.accessToken);
      console.log("acquired token: ", token);
    }
  }, [window.location.hash]);

  return {
    loggedIn: loggedIn,
    login: () => {
      window.location.assign(
        `https://accounts.spotify.com/authorize?client_id=${
          config.clientId
        }&redirect_uri=${config.redirectUri}&scope=${config.scopes.join(
          "%20"
        )}&response_type=token&show_dialog=true`
      );
    },
    token: token,
    client: client,
    logout: () => {
      setToken(null);
      setLoggedIn(false);
      client.setAccessToken(null);
      window.location.hash = "";
    },
  };
}

export type SpotifyAuthToken = {
  accessToken: string;
  tokenType: string;
  expires: Date;
};
//access_token=BQCW3OnZOdobNC4FZmFGT60Np6osvw2c8f1jU7ZJQD-dPjHJ_WO5hOf3LjMbLtbvQc43fGdGCqrNSS-xxcmeJabMBBIAlnDUPkMub7lfNxEmrLFOb-bfD0Jahutykk-26XQRPuzTdxt3DA4IZAxZoclnOySrxLPyZAyRWjrK8Y8Ushc8CfjPtp7V9angZyVKHOhmzbLzyTRIJuqbB3MtJmYw

//token_type=Bearer

//expires_in=3600
