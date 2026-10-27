import * as mpdRepository from "../repositories/mpdRepository.js"

export const getMpdStream = async (channelName) => {
    const mpdStream = await mpdRepository.getMpd(channelName);
    return mpdStream;
};
