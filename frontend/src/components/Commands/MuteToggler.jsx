import React from 'react';
import useIsMobile from "../../hooks/useIsMobile";
import WebMuteToggler from "./WebMuteToggler";
import MobileMuteToggler from "./MobileMuteToggler";

const MuteToggler = ({ audioRef, channelName, onShowChannels }) => {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile && <MobileMuteToggler audioRef={audioRef} channelName={channelName} onShowChannels={onShowChannels} />}
      {!isMobile && <WebMuteToggler audioRef={audioRef} channelName={channelName} />}
    </>
  );
};

export default MuteToggler;
