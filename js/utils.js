const storage = "timeLogStorage"
function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function parseJSONRequest(jsonData) {
    return {
        "jsonrpc": "2.0",
        "method": "call",
        "params": jsonData,
        "id": null
    }
}
function _mapParams(jsonData) {
    let params = false;
    let keys = []
    for (let key in jsonData) {
        keys.push(`${key}=${jsonData[key]}`)
    }
    if (keys.length)
        params = keys.join("\&")
    return params
}
function _pushParams(serverURL, jsonData) {
    params = _mapParams(jsonData)
    if (params) {
        serverURL += "?" + params
    }
    return serverURL
}

function parseSecondToString(hpd=8, dpw=5){
    return function secondToString(time) {
        let data = [{ 'key': 'w', 'duration': dpw*hpd*3600 },
        { 'key': 'd', 'duration': hpd*3600 },
        { 'key': 'h', 'duration': 3600 },
        { 'key': 'm', 'duration': 60 },
        { 'key': 's', 'duration': 1 }]
        let response = ""
        for (let segment of data) {
            let duration = segment['duration'];
            if (time >= duration) {
                response += `${parseInt(time / duration)}${segment['key']} `
                time -= (parseInt(time / duration) * duration)
            }
        }
        if (!response.length){
            response = "0s"
        }
        return response
    }
}