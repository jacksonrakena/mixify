import { useEffect, useState } from "preact/hooks";
import SpotifyWebApi from "spotify-web-api-js";
import "./app.css";

const endpoint = "https://accounts.spotify.com/authorize";
const redirecturi = "http://127.0.0.1:5173/";
const clientId = "b96e260c2a344a6e86950b8c2076d052";
const scopes = [
  "user-follow-read",
  "user-library-read",
  "user-read-recently-played",
];

const loginurl = `${endpoint}?client_id=${clientId}&redirect_uri=${redirecturi}&scope=${scopes.join(
  "%20"
)}&response_type=token&show_dialog=true`;

const getToken = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

export function App() {
  const [count, setCount] = useState(0);
  const [token, setToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  useEffect(() => {
    if (!token?.access_token) {
      const token = getToken();
      console.log(token);
      if (token?.access_token) {
        setToken(token?.access_token);
        const spotify = new SpotifyWebApi();
        spotify.setAccessToken(token.access_token);
        spotify.getMe().then((d) => {
          console.log(d.id);
          spotify.getUserPlaylists(d.id).then((p) => {
            setPlaylists(p.items);
          });
        });
      }
    }
  }, []);

  return (
    <>
      <h1>{token && "logged in "}</h1>
      <div class="card">
        {!token && <a href={loginurl}>Login</a>}
        <ul>
          {playlists &&
            playlists.map((pd) => {
              return <li>{pd.name}</li>;
            })}
        </ul>
        <p>
          Edit <code>src/app.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}
