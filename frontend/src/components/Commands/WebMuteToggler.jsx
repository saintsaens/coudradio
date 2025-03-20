import React, { useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../store/features/audioPlayerSlice";
import WebUnmuteCommand from "./WebUnmuteCommand";
import ChannelSwitcher from "./ChannelSwitcher";
import ChannelContainer from "../ChannelContainer";

const WebMuteToggler = ({ audioRef, channelName }) => {
  const isMuted = useSelector((state) => state.audioPlayer.isMuted);
  const dispatch = useDispatch();

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      dispatch(setMuted(audio.muted));
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        handleToggleMute();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [audioRef]);

  return (
    <>
      {isMuted
        ?
        <WebUnmuteCommand />
        :
        <>
          <ChannelContainer channelName={channelName} />
          <ChannelSwitcher />
        </>
      }
    </>
  );
};

export default WebMuteToggler;
