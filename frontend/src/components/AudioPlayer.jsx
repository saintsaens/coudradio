import React, { useEffect } from "react";
import dashjs from "dashjs";
import { computeStartTime } from "../utils/time.js";
import { useDispatch } from "react-redux";
import { setMuted, setError, setPlaying, setLoadingProgress } from "../store/features/audioPlayerSlice.js";
import Background from "./Background.jsx";

const SEGMENT_PROGRESS = { InitializationSegment: 75, MediaSegment: 100 };

const AudioPlayer = ({ audioRef, channelName }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const src = `${backendUrl}/${channelName}`;

  const dispatch = useDispatch();
  let player = null; // Keep track of the Dash.js player instance

  const setupPlayer = (video) => {
    player = dashjs.MediaPlayer().create();

    player.initialize();
    player.updateSettings({ debug: { logLevel: dashjs.Debug.LOG_LEVEL_ERROR } });
    player.attachView(video);
    player.setAutoPlay(true);

    player.on(dashjs.MediaPlayer.events.PLAYBACK_NOT_ALLOWED, () => {
      console.log("Autoplay restrictions detected. Muting and resuming.");
      video.muted = true;
      dispatch(setMuted(true));
      video.play().catch((err) => console.error("Muted playback failed:", err));
    });
    // Advance the loading bar at each download playback waits on: manifest (50), init segment, first media segment.
    // The buffer level can't drive it, since it stays at 0 until the first segment is appended, right before playback.
    let progress = 50;
    player.on(dashjs.MediaPlayer.events.FRAGMENT_LOADING_COMPLETED, (e) => {
      const milestone = SEGMENT_PROGRESS[e.request?.type];
      if (e.error || !milestone || milestone <= progress) return;
      progress = milestone;
      dispatch(setLoadingProgress(progress));
    });

    player.on(dashjs.MediaPlayer.events.PLAYBACK_PLAYING, () => {
      dispatch(setPlaying(true));
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: channelName,
          artist: 'Coudradio',
          artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
        });
        navigator.mediaSession.setActionHandler('play', () => video.play());
        navigator.mediaSession.setActionHandler('pause', () => video.pause());
      }
    });
  };

  const cleanupPlayer = () => {
    if (player) {
      player.reset();
      player = null; // Ensure the old player instance is removed
    }
  };

  const retrieveManifest = (dashPlayer) =>
    new Promise((resolve, reject) => {
      dashPlayer.retrieveManifest(src, (manifest, error) => (manifest ? resolve(manifest) : reject(error)));
    });

  const initializeStream = async () => {
    const video = audioRef.current;
    if (!video) return;

    // Clean up any existing player before initializing
    cleanupPlayer();
    dispatch(setLoadingProgress(0));

    video.loop = true;
    dispatch(setMuted(video.muted));
    setupPlayer(video);
    const currentPlayer = player;

    // Fetch the MPD once: read the playlist duration from it, then hand the parsed manifest to dash.js
    let manifest;
    try {
      manifest = await retrieveManifest(currentPlayer);
    } catch (error) {
      console.error("Error fetching stream:", error);
      if (player === currentPlayer) dispatch(setError(true));
      return;
    }

    // Player was reset (unmount or channel switch) while the manifest was loading
    if (player !== currentPlayer) return;

    const duration = manifest.mediaPresentationDuration;
    if (!duration) {
      console.error("Could not read MPD duration");
      dispatch(setError(true));
      return;
    }

    dispatch(setLoadingProgress(50));
    player.attachSource(manifest, computeStartTime(duration));
  };

  useEffect(() => {
    initializeStream();

    return () => {
      cleanupPlayer(); // Ensure cleanup when the component unmounts or reinitializes
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, dispatch]);

  return (
    <Background>
      <video ref={audioRef} />
    </Background>
  );
};

export default AudioPlayer;
