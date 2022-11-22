/// <reference path="../node_modules/spotify-web-api-js/src/typings/spotify-web-api.d.ts" />

import { useEffect, useState } from "preact/hooks";
import SpotifyWebApi from "spotify-web-api-js";
import "./app.css";
import { useSpotifyAuth } from "./auth";
const endpoint = "https://accounts.spotify.com/authorize";
//const redirecturi = "http://localhost:5173/";
const redirecturi = import.meta.env.VITE_BASE_URL;
const clientId = "b96e260c2a344a6e86950b8c2076d052";
const bingus = "12135528270";
const friendId = "samlxluo";
const nate = "vnvbb59ivtwyt9y7ipu70g9jq";
const seb = "ultimate_souffle";
const balls = "liketotallytoby";
const alex = "wronfulframe5";
const jul = "12163750844";
const scopes = [
  "user-follow-read",
  "user-library-read",
  "user-read-recently-played",
];
const spotifyConfig = {
  scopes: scopes,
  clientId: clientId,
  redirectUri: redirecturi,
};

export async function greed<T>(
  client: SpotifyWebApi.SpotifyWebApiJs,
  pager: SpotifyApi.PagingObject<T>
): Promise<T[]> {
  return pager.items.concat(
    pager.next
      ? await greed<T>(
          client,
          (await client.getGeneric(pager.next)) as SpotifyApi.PagingObject<T>
        )
      : ([] as T[])
  );
}

type DownloadedPlaylist = SpotifyApi.PlaylistObjectSimplified & {
  state: string;
  downloadedTracks: SpotifyApi.PlaylistTrackObject[];
  original: { href: string; total: number };
};

export function useDownloadedUser(id: string) {
  const { client } = useSpotifyAuth(spotifyConfig);
  const [user, setUser] = useState<SpotifyApi.UserObjectPublic>();
  const [playlists, setPlaylists] = useState<DownloadedPlaylist[]>([]);
  const [numberOfTotalTracks, setTotalNumber] = useState(-1);
  const [complete, setComplete] = useState(0);
  useEffect(() => {
    (async () => {
      if (!user) {
        const u = await client.getUser(id);
        setUser(u);
        const playlists = await (
          await greed(client, await client.getUserPlaylists(id))
        ).filter((d) => !d.collaborative && d.id !== "4swvYTF3ykCXM5pfmTnP5h");
        setPlaylists(
          playlists.map((p) => {
            return {
              ...p,
              state: "not_started",
              downloadedTracks: [],
              original: { href: p.tracks.href, total: p.tracks.total },
            };
          })
        );
        setTotalNumber(playlists.reduce((a, b) => a + b.tracks.total, 0));
        for (const playlist of playlists) {
          setPlaylists((state) =>
            state.map((p) => {
              if (p.id === playlist.id) {
                return { ...p, state: "downloading" };
              } else {
                return p;
              }
            })
          );
          if (window.sessionStorage.getItem(playlist.id)) {
            const tracks = JSON.parse(
              window.sessionStorage.getItem(playlist.id)!
            ) as any[];
            setPlaylists((state) =>
              state.map((p) => {
                if (p.id === playlist.id) {
                  return {
                    ...p,
                    state: "downloaded",
                    downloadedTracks: tracks,
                  };
                } else {
                  return p;
                }
              })
            );
            setComplete((c) => c + tracks.length);
          } else {
            const tracks = await greed(
              client,
              await client.getPlaylistTracks(playlist.id)
            );
            setPlaylists((state) =>
              state.map((p) => {
                if (p.id === playlist.id) {
                  return {
                    ...p,
                    state: "downloaded",
                    downloadedTracks: tracks,
                  };
                } else {
                  return p;
                }
              })
            );
            setComplete((c) => c + tracks.length);
          }
        }
      }
    })();
  }, [id]);
  return {
    user: user,
    playlists: playlists,
    state:
      complete === numberOfTotalTracks
        ? "completed"
        : numberOfTotalTracks === -1
        ? "downloading playlists"
        : "downloading tracks " + complete + "/" + numberOfTotalTracks,
  };
}

export const UserContainer = (props: { id: string }) => {
  const { user, playlists } = useDownloadedUser(props.id);
  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
      >
        <img
          style={{ borderRadius: 50 }}
          src={user?.images ? user?.images[0].url : ""}
          height="40"
          width="40"
        />
        <div style={{ marginLeft: "10px" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
            {user?.display_name}
          </div>
          <div>
            {playlists?.length} playlists,{" "}
            {playlists?.reduce((a, b) => a + b.tracks.total, 0)} tracks
          </div>
        </div>
      </div>
      <div>
        {playlists && playlists.length > 0 && (
          <div style={{ display: "flex", flex: "1", flexDirection: "column" }}>
            {playlists &&
              playlists.map((pd) => {
                return <PlaylistBox playlist={pd} />;
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export const PlaylistBox = (props: { playlist: DownloadedPlaylist }) => {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: "10px",
        marginRight: "10px",
        border: "1px solid black",
        padding: "10px",
        borderRadius: "10px",
      }}
    >
      <img src={props.playlist.images[0].url} width="50" height="50" />
      <div
        style={{ marginLeft: "10px", display: "flex", flexDirection: "column" }}
      >
        <div style={{ fontWeight: "bold" }}>{props.playlist.name}</div>
        <div>
          {props.playlist.state === "downloaded" ? (
            <>{props.playlist.downloadedTracks.length} songs</>
          ) : (
            props.playlist.state
          )}
        </div>
      </div>
    </div>
  );
};

export function useDownloadedPlaylist(id: string) {
  const [tracks, setTracks] = useState<SpotifyApi.PlaylistTrackObject[]>(
    [] as any
  );
  const { client } = useSpotifyAuth(spotifyConfig);
  useEffect(() => {
    (async () => {
      const dtracks = await greed(client, await client.getPlaylistTracks(id));
      setTracks(dtracks);
    })();
  }, [id]);
  return tracks;
}

export function Analysis2() {}

export function Authorized(props: { id: string; otheruser: string }) {
  const user0 = useDownloadedUser(props.id);
  const other0 = useDownloadedUser(props.otheruser);
  const [analysis, setAnalysis] = useState<
    {
      track: SpotifyApi.TrackObjectSimplified;
      playlist0: SpotifyApi.PlaylistObjectSimplified;
      playlist1: SpotifyApi.PlaylistObjectSimplified;
    }[]
  >([]);
  const [topSharedArtists, setTopSharedArtists] = useState<
    { artist: SpotifyApi.ArtistObjectSimplified; count: number }[]
  >([]);
  useEffect(() => {
    if (
      user0.state === "completed" &&
      other0.state === "completed" &&
      analysis.length === 0
    ) {
      setAnalysis([]);
      for (const playlist of user0.playlists) {
        for (const otherPlaylist of other0.playlists) {
          for (const track of playlist.downloadedTracks) {
            if (
              otherPlaylist.downloadedTracks.find(
                (o) => o.track?.id === track.track?.id
              )
            ) {
              const t = track.track as SpotifyApi.TrackObjectSimplified;
              setAnalysis((a) => [
                ...a,
                {
                  track: t,
                  playlist0: playlist,
                  playlist1: otherPlaylist,
                },
              ]);
              console.log("updating TSA");
              setTopSharedArtists((a) => {
                if (!t) return a;
                if (a.find((x) => x.artist?.id === t?.artists[0]?.id)) {
                  const v = [
                    ...a.filter((x) => x.artist.id !== t.artists[0].id),
                    {
                      artist: t.artists[0],
                      count:
                        a.find((x) => x.artist.id === t.artists[0].id)!.count +
                        1,
                    },
                  ];
                  v.sort((a, b) => b.count - a.count);
                  return v;
                }
                const d = [...a, { artist: t.artists[0], count: 1 }];
                d.sort((a, b) => b.count - a.count);
                return d;
              });
            }
          }
        }
      }
    }
  }, [user0, other0]);

  return (
    <>
      <div>
        {user0.state} - {other0.state}
      </div>
      {analysis.length > 0 && (
        <div>
          <div style={{ marginBottom: "10px" }}>
            <div>
              <strong>{user0.user?.display_name}</strong> shares{" "}
              {(analysis.length /
                user0.playlists.reduce(
                  (a, b) => a + b.downloadedTracks.length,
                  0
                )) *
                100}
              % of their library with{" "}
              <strong>{other0.user?.display_name}</strong>
            </div>
            <div>
              <strong>{other0.user?.display_name}</strong> shares{" "}
              {(analysis.length /
                other0.playlists.reduce(
                  (a, b) => a + b.downloadedTracks.length,
                  0
                )) *
                100}
              % of their library with{" "}
              <strong>{user0.user?.display_name}</strong>
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            The top shared artists between these two users are:
            <div>
              {topSharedArtists.slice(0, 5).map((d) => (
                <div>
                  {d.artist.name} ({d.count} shared songs)
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div>
        {analysis.map((a) => {
          return (
            <div
              key={a.track?.id + a.playlist0.id + a.playlist1.id}
              style={{
                border: "1px solid black",
                padding: "15px",
                borderRadius: "25px",
                marginBottom: "10px",
                display: "flex",
              }}
            >
              <div>
                <img
                  //@ts-ignore
                  src={
                    a.track?.album.images ? a.track?.album.images[0].url : ""
                  }
                  height="50"
                  width="50"
                />
              </div>
              <div style={{ marginLeft: "10px" }}>
                <div>
                  {a.track?.name}, by {a.track?.artists[0].name}
                </div>
                <div style={{ marginLeft: "15px" }}>
                  Your playlist: {a.playlist0.name} &bull; Their playlist:{" "}
                  {a.playlist1.name} <br />
                  {(a as any).track?.album.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
export function App() {
  const { logout, client, loggedIn, login } = useSpotifyAuth(spotifyConfig);
  const [me, setMe] = useState<SpotifyApi.CurrentUsersProfileResponse | null>(
    null
  );
  const [otheruser, setotheruser] = useState("");
  const [entry, setentry] = useState("");
  useEffect(() => {
    if (loggedIn) {
      client.getMe().then((d) => {
        console.log("acquired me", d);
        setMe(d);
      });
    }
  }, [loggedIn]);

  return (
    <>
      {!loggedIn && (
        <>
          <div>Welcome to Mixify.</div>
          <button onClick={login}>Login</button>
        </>
      )}
      {loggedIn && me && (
        <div>
          <h1>
            {me?.display_name}, {me?.followers?.total} followers
          </h1>
          <h3>
            <button onClick={logout}>Logout</button>
          </h3>
        </div>
      )}
      {me && !otheruser && (
        <div>
          Paste the Spotify profile link for a friend you'd like to Mixify with:
          <br />
          <input
            type="text"
            value={entry}
            size={100}
            //@ts-ignore
            onChange={(e) => setentry(e.target?.value)}
          />
          <button
            onClick={() => {
              const comp = entry.split("/");
              const uid = comp[comp.length - 1];
              setotheruser(uid.split("?")[0]);
            }}
          >
            Mixify
          </button>
          <br />
          <div style={{ fontSize: "small", color: "gray" }}>
            i.e. https://open.spotify.com/user/12135528270?si=23b0a740756a471b
          </div>
        </div>
      )}
      {me && otheruser && (
        <>
          <Authorized id={me.id} otheruser={otheruser} />
        </>
      )}
    </>
  );
}
