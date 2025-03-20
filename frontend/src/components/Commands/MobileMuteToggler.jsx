import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import { setMuted } from "../../store/features/audioPlayerSlice";
import MobileChannelContainer from "../MobileChannelContainer";

const MobileMuteToggler = ({ audioRef }) => {
    const isMuted = useSelector((state) => state.audioPlayer.isMuted);
    const dispatch = useDispatch();

    const handleToggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = !audio.muted;
            dispatch(setMuted(audio.muted));
        }
    };

    return (
        <>
            {isMuted
                ?
                <MobileUnmuteCommand onClick={handleToggleMute} />
                :
                <MobileChannelContainer channelName={channelName} onClick={handleToggleMute} />
            }
        </>
    );
};

export default MobileMuteToggler;
