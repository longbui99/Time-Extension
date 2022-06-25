const storage = "timeLogStorage"


function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function uniqueID(key=""){
    return '_' + Math.random().toString(36).substring(2, 9) + key;
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

let ac_rules = {
    '**': ['<b>', '</b>'],
    '*': ['<em>', '</em>'],
}
let replace_rule = {
    '\r\n\r\n': '<br>',
    '\r\n': '<br>',
    '\n': '<br>'
}

function parseAC(text){
    for( let rule in replace_rule)
        text = text.replaceAll(rule, replace_rule[rule])
    let pivot = 0, index = 0, final = [''], final_key = 0;
    let length = text.length;
    let res = "";
    while (index < length){
        for (let key in ac_rules){
            if (index + key.length <= length){
                if (text.substring(index, index+key.length) === key){
                    if (final[final_key].length > 0){
                        if (key.length <= final[final_key].length){
                            let substring = text.substring(pivot, index)
                            if (substring.length){
                                res = `${ac_rules[key][0]}${substring}${ac_rules[key][1]}`
                            } else{
                                res = key + key
                            }
                            final.push(res)
                            final[final_key] = final[final_key].substring(0, final[final_key].length - key.length)
                        } else {
                            final[final_key] += key
                        }
                    } else {
                        final.push(text.substring(pivot, index))
                        final.push(key)
                        final_key = final.length-1
                    }
                    index += key.length - 1
                    pivot = index + 1
                    break
                }
            }
        }
        index++
    }
    if (pivot !== index){
        final.push(text.substring(pivot, index))
    }
    return final.join("")
}