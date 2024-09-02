import { httpGet } from "../http-request-handler"


export const getAuthors = (): Promise<string[]> => {
    return httpGet<string[]>('/audios/extra/author')
    .then(
        (result: string[]) => {
            return Promise.resolve(result);
        },
        (error: Error) => {
            return Promise.reject(error);
        }
    );
}

export const getThemes= (): Promise<string[]> =>{
    return httpGet<string[]>('/audios/extra/theme')
    .then(
        (result: string[]) => {
            return Promise.resolve(result);
        },
        (error: Error) => {
            return Promise.reject(error);
        }
    );
}