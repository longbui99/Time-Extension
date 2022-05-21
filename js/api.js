const storage = "TimeLogStorage"

function parseJSONRequest(jsonData){
    return {
        "jsonrpc": "2.0",
        "method": "call",
        "params": jsonData,
        "id": null
    }
}
function _mapParams(jsonData){
    let params = false;
    let keys = []
    for (let key in jsonData){
        keys.push(`${key}=${jsonData[key]}`)
    }
    if (keys.length)
        params = keys.join("\&")
    return params
}
function _pushParams(serverURL, jsonData){
    params = _mapParams(jsonData)
    if (params){
        serverURL += "?" + params
    }
    return serverURL
}