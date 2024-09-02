import moment from "moment";
import { httpPost } from "./http-request-handler";


export enum AnalyticEventsName {
    PAGE_LOAD,
    START_LISTENING_AUDIO,
    AUDIO_DOWNLOADED
}

const clientIdLocalStorageName = 'clientId';

export const initLocalStorageForAnalyticEvents = () => {
    const clientId: string = JSON.parse(localStorage.getItem(clientIdLocalStorageName));
    if(!clientId) {
        localStorage.setItem(clientIdLocalStorageName, JSON.stringify(crypto.randomUUID()));
    }
}

export const sendAnalytics = (eventName: AnalyticEventsName): void => {
    const analyticBody = JSON.stringify({
        clientId: JSON.parse(localStorage.getItem(clientIdLocalStorageName)),
        date: moment.utc(),
        eventName: eventName,
    });

    httpPost('/analytics', analyticBody);
}
