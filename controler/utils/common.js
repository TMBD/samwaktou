let _ = require("lodash");
const lowerCaseArray = (arrayString) => {
    if(_.isArray(arrayString)){
        var result = [];
        arrayString.forEach(element => {
            result.push(_.toLower(element));
        });

        return result;
    }else return arrayString;
    
}

exports.lowerCaseArray = lowerCaseArray;