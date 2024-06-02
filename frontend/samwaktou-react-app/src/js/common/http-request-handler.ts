const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;
type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
export enum HttpRespTransformer {
    JSON,
    NONE
}

export const httpGet = async <T>(path: string, responseTranformer?: HttpRespTransformer, token?: string, contentType?: string): Promise<T> => {
    return handleHttpRequest('GET', path, null, token, contentType, responseTranformer);
};

export const httpPost = async <T>(path: string, data: BodyInit, token?: string, contentType?: string): Promise<T> => {
    return handleHttpRequest('POST', path, data, token, contentType);
};

export const httpPut = async <T>(path: string, data: BodyInit, token?: string, contentType?: string): Promise<T> => {
    return handleHttpRequest('PUT', path, data, token, contentType);
};

export const httpDelete = async <T>(path: string, token?: string, contentType?: string): Promise<T> => {
    return handleHttpRequest('DELETE', path, null, token, contentType);
};

const handleHttpRequest = async <T>(
    method: HttpMethod, 
    path: string,
    data?: BodyInit, 
    token?: string, 
    contentType?: string,
    responseTranformer?: HttpRespTransformer): Promise<T> => {
    return fetch(API_SERVER_URL+path, {
        method: method,
        headers: {
            "auth-token": token || null,
            // Do not set 'Content-Type' if data is FormData
            ...((data instanceof FormData) ? {} : { "Content-Type": contentType??  'application/json'}),
        },
        body: data || null
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        switch(responseTranformer){
            case HttpRespTransformer.NONE: return res;
            default: return res.json();
        }
    })
    .then(
        (result: T) => {
            return Promise.resolve(result);
        },
        (error) => {
            return Promise.reject(new Error(getErrorMessage(error)) );
        }
    );
}

const getErrorMessage = (error: unknown): string => {
    let errorMessage = "Une erreur s'est produite. Veuillez réessayer plus tard.";

    if (error instanceof TypeError) {
        errorMessage = "Erreur réseau. S'il vous plait, vérifiez votre connexion internet.";
    } else if (error instanceof SyntaxError) {
        errorMessage = "Erreur serveur, données non valides.";
    } else if (error instanceof Error) {
        if (error?.message?.charAt(0) === "4") {
            errorMessage = "Ressource introuvable.";
        } else if (error?.message === "503") {
            errorMessage = "Service temporairement indisponible.";
        } else if (error?.message?.charAt(0) === "5") {
            errorMessage = "Erreur interne du serveur.";
        } else {
            errorMessage = "Erreur inattendue.";
        }
    }

    return errorMessage;
}
