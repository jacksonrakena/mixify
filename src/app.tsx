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
        ).filter(
          (d) =>
            !d.collaborative &&
            d.id !== "4swvYTF3ykCXM5pfmTnP5h" &&
            !d.name.includes("Top Songs")
        );
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
          src={user?.images ? user?.images[0]?.url : ""}
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
      <img
        src={props.playlist.images ? props.playlist.images[0]?.url : ""}
        width="50"
        height="50"
      />
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
  const [analysisState, setAnalysisState] = useState<
    "Not started" | "Analysing" | "Completed"
  >("Not started");
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
              track?.track.id &&
              otherPlaylist.downloadedTracks.find(
                (o) => o.track?.id && o.track?.id === track.track?.id
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
    <div style={{ marginTop: "30px" }}>
      {(user0.state !== "completed" || other0.state !== "completed") && (
        <div style={{ marginBottom: "30px" }}>
          {user0.state} - {other0.state}
        </div>
      )}
      {analysis.length > 0 && (
        <>
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  border: "4px solid transparent",
                  borderRadius: "8px",
                  padding: "10px",
                  paddingLeft: "15px",
                  display: "inline-flex",
                  alignItems: "center",
                  background:
                    "linear-gradient(white, white) padding-box, linear-gradient(135deg, #09009f, #00ff95 90%) border-box",
                }}
              >
                <div>
                  <img
                    style={{ borderRadius: "8px" }}
                    src={user0?.user?.images ? user0?.user?.images[0]?.url : ""}
                    width={"50"}
                    height={"50"}
                  />
                </div>
                <div style={{ paddingLeft: "10px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {user0?.user?.display_name}
                  </div>
                  <div>{user0?.user?.followers?.total} followers</div>
                </div>
              </div>
              <div
                style={{
                  marginLeft: "20px",
                  fontSize: "1.6rem",
                  fontWeight: "bold",
                }}
              >
                X
              </div>
              <div
                style={{
                  border: "4px solid transparent",
                  borderRadius: "8px",
                  padding: "10px",
                  marginLeft: "20px",
                  paddingLeft: "15px",
                  display: "inline-flex",
                  alignItems: "center",
                  background:
                    "linear-gradient(white, white) padding-box, linear-gradient(135deg, #09009f, #00ff95 90%) border-box",
                }}
              >
                <div>
                  <img
                    style={{ borderRadius: "8px" }}
                    src={
                      other0?.user?.images ? other0?.user?.images[0]?.url : ""
                    }
                    width={"50"}
                    height={"50"}
                  />
                </div>
                <div style={{ paddingLeft: "10px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                    {other0?.user?.display_name}
                  </div>
                  <div>{other0?.user?.followers?.total} followers</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "30px", marginBottom: "10px" }}>
              <div>
                You share <b>{analysis.length} songs</b> and{" "}
                <b>{topSharedArtists.length} artists</b>.
              </div>
              <div>
                <strong>{user0.user?.display_name}</strong> shares{" "}
                {(
                  (analysis.length /
                    user0.playlists.reduce(
                      (a, b) => a + b.downloadedTracks.length,
                      0
                    )) *
                  100
                ).toFixed(2)}
                % of their library with{" "}
                <strong>{other0.user?.display_name}</strong>
              </div>
              <div>
                <strong>{other0.user?.display_name}</strong> shares{" "}
                {(
                  (analysis.length /
                    other0.playlists.reduce(
                      (a, b) => a + b.downloadedTracks.length,
                      0
                    )) *
                  100
                ).toFixed(2)}
                % of their library with{" "}
                <strong>{user0.user?.display_name}</strong>
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <h4>YOUR TOP ARTISTS</h4>
              <div>
                {topSharedArtists.slice(0, 5).map((d) => (
                  <div style={{ display: "flex" }}>
                    <div></div>
                    <div>
                      {d.artist.name} ({d.count} shared songs)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h4>YOUR SHARED SONGS</h4>
            {analysis.map((a) => {
              return (
                <div
                  key={a.track?.id + a.playlist0.id + a.playlist1.id}
                  style={{
                    border: "0px solid black",
                    padding: "15px",
                    borderRadius: "25px",
                    marginBottom: "10px",
                    display: "flex",
                  }}
                >
                  <div>
                    <img
                      style={{ borderRadius: "8px" }}
                      src={
                        //@ts-ignore
                        a.track?.album.images
                          ? //@ts-ignore
                            a.track?.album.images[0]?.url
                          : ""
                      }
                      height="50"
                      width="50"
                    />
                  </div>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      marginLeft: "10px",
                    }}
                  >
                    <div>
                      <div>
                        <span style={{ fontWeight: "bold" }}>
                          {a.track?.name}
                        </span>
                        , by {a.track?.artists[0]?.name}
                      </div>
                      <div>
                        {" "}
                        <b>Album:</b> {(a as any).track?.album.name}
                      </div>
                    </div>
                    <div>
                      <div>
                        <b>{user0?.user?.display_name}</b>'s{" "}
                        <i>{a.playlist0.name}</i>
                      </div>
                      <div>
                        <b>{other0?.user?.display_name}</b>'s{" "}
                        <i>{a.playlist1.name}</i>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
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
          <h1
            style={{
              background: "linear-gradient(to right, #09009f, #00ff95 20%)",
              backgroundClip: "text",
              webkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Mixify
          </h1>
          <div
            style={{
              border: "4px solid transparent",
              borderRadius: "8px",
              padding: "10px",
              paddingLeft: "15px",
              display: "inline-flex",
              alignItems: "center",
              background:
                "linear-gradient(white, white) padding-box, linear-gradient(135deg, #09009f, #00ff95 90%) border-box",
            }}
          >
            <div>
              <img
                style={{ borderRadius: "8px" }}
                src={me?.images ? me?.images[0]?.url : ""}
                width={"50"}
                height={"50"}
              />
            </div>
            <div style={{ paddingLeft: "10px" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                {me?.display_name}
              </div>
              <div>{me?.followers?.total} followers</div>
            </div>
          </div>
        </div>
      )}
      {me && (
        <div style={{ marginTop: "25px" }}>
          Paste the Spotify profile link for a friend you'd like to Mixify with:
          <br />
          <input
            type="text"
            value={entry}
            size={100}
            placeholder={
              "https://open.spotify.com/user/snb2thpiem5yc2wf346k60hx1?si=19796645954d436b"
            }
            //@ts-ignore
            onChange={(e) => setentry(e.target?.value)}
            style={{
              marginTop: "10px",
              outlineColor: "#09009f",
              padding: "10px",
            }}
          />{" "}
          <br />
          <button
            style={{
              marginTop: "10px",
              padding: "10px 20px 10px 20px",
              backgroundColor: "#09009f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.05rem",
              fontWeight: "bold",
            }}
            onClick={() => {
              const comp = entry.split("/");
              const uid = comp[comp.length - 1];
              setotheruser("");
              setTimeout(() => setotheruser(uid.split("?")[0]), 300);
            }}
          >
            Mixify
          </button>
          <button
            style={{
              marginLeft: "15px",
              marginTop: "10px",
              padding: "10px 20px 10px 20px",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.05rem",
              fontWeight: "bold",
            }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
      {me && otheruser && (
        <div style={{ marginTop: "30px" }}>
          <Authorized id={me.id} otheruser={otheruser} />
        </div>
      )}
    </>
  );
}
