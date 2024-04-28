function parseErrorInJson(error){
    return (error instanceof Error) ? 
    {
        // Pull all enumerable properties, supporting properties on custom Errors
        ...error,
        // Explicitly pull Error's non-enumerable properties
        name: error.name,
        message: error.message,
        //   stack: error.stack,
    }
    :error
}

module.exports = {parseErrorInJson}