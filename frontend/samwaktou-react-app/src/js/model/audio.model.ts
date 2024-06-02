import moment, { Moment } from "moment";

type BaseAudioInfos = {
    id: string;
    uri: string;
    theme: string; 
    author: string; 
    description: string; 
    keywords: string;
    durationDisplay: string;
}

export type AudioInfos = BaseAudioInfos & {
    date: Moment;
}

export type SerializedAudioInfos = BaseAudioInfos & {
    date: string;
}

export const buildAudioInfos = (serializedAudioInfos: SerializedAudioInfos): AudioInfos => {
    if(!serializedAudioInfos) return null;
    return {
        ...serializedAudioInfos,
        date: moment(serializedAudioInfos.date)
    };
}

export const buildAudioInfosArray = (serializedAudioInfosList: SerializedAudioInfos[]): AudioInfos[] => {
    if(!serializedAudioInfosList) return [];
    return serializedAudioInfosList
        .map(serializedAudioInfos => buildAudioInfos(serializedAudioInfos))
        .filter(serializedAudioInfos => !!serializedAudioInfos);
}

export const buildSerializedAudioInfos = (audioInfos: AudioInfos): SerializedAudioInfos => {
    if(!audioInfos) return null;
    return {
        ...audioInfos,
        date: audioInfos.date.toISOString()
    };
}