interface IParseErrorResult {
    name?: string;
    message?: string;
    error: unknown;
}

export interface InternalErrorResponse {
    success: boolean,
    reason?: string,
    message?: string, 
    details?: unknown
}

export type ErrorResponse = InternalErrorResponse | IParseErrorResult;

export const parseErrorInJson = (error: unknown): IParseErrorResult => {
    return (error instanceof Error) ? 
    {
        error: error,
        // Explicitly pull Error's non-enumerable properties
        name: error.name,
        message: error.message,
        //   stack: error.stack,
    }:{
        error: error,
    }
}