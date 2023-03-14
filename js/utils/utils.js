
export function _getDisplayName(record, length = 40000) {
    if (record.name === undefined) {
        return ''
    }
    return `${record.key}: ${(record.name.length > length) ? record.name.substring(0, length) + "..." : record.name}`;
}
export function _minifyString(string, length) {
    if (string.length >= length) {
        string = string.split(" ").map(e => e[0].toUpperCase()).join("")
    }
    return string
}
export function fetchSpecialClass(record) {
    if (record.status_key === 'done' || (typeof record.status === 'string' && (record.status.startsWith('QA') || record.status.startsWith('UAT')))) {
        return 'done-line'
    }
    return 'normal'
}
export function secondToHour(second) {
    let hour = String(parseInt(second / 3600)).padStart(2, "0");
    let minute = String(parseInt(second % 3600 / 60)).padStart(2, "0");
    return `${hour}:${minute}`
}
export function secondToHMS(second) {
    let hour = String(parseInt(second / 3600)).padStart(2, "0");
    let minute = String(parseInt(second % 3600 / 60)).padStart(2, "0");
    second = String(parseInt(second % 60)).padStart(2, "0");
    return `${hour}:${minute}:${second}`
}

export function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

export function uniqueID(key = "") {
    return '_' + Math.random().toString(36).substring(2, 9) + key;
}

export function parseJSONRequest(jsonData) {
    return {
        "jsonrpc": "2.0",
        "method": "call",
        "params": jsonData,
        "id": null
    }
}
export function _mapParams(jsonData) {
    let params = false;
    let keys = []
    for (let key in jsonData) {
        keys.push(`${key}=${jsonData[key]}`)
    }
    if (keys.length)
        params = keys.join("\&")
    return params
}
export function _pushParams(serverURL, jsonData) {
    params = _mapParams(jsonData)
    if (params) {
        serverURL += "?" + params
    }
    return serverURL
}

export function secondToHMSString(time) {
    let data = [
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
    if (!response.length) {
        response = "0s"
    }
    return response
}


export function parseSecondToString(hpd = 8, dpw = 5) {
    return function secondToString(time) {
        let data = [{ 'key': 'w', 'duration': dpw * hpd * 3600 },
        { 'key': 'd', 'duration': hpd * 3600 },
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
        if (!response.length) {
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
    '\r\n\r\n': '<br/>',
    '\n\r\n': '<br/>',
    '\r\n': '<br/>',
    '\n': '<br/>'
}

export function parseChecklist(text) {
    for (let rule in replace_rule)
        text = text.replaceAll(rule, replace_rule[rule])
    let pivot = 0, index = 0, final = [''], final_key = 0;
    let length = text.length;
    let res = "";
    while (index < length) {
        for (let key in ac_rules) {
            if (index + key.length <= length) {
                if (text.substring(index, index + key.length) === key) {
                    if (final[final_key].length > 0) {
                        if (key.length <= final[final_key].length) {
                            let substring = text.substring(pivot, index)
                            if (substring.length) {
                                res = `${ac_rules[key][0]}${substring}${ac_rules[key][1]}`
                            } else {
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
                        final_key = final.length - 1
                    }
                    index += key.length - 1
                    pivot = index + 1
                    break
                }
            }
        }
        index++
    }
    if (pivot !== index) {
        final.push(text.substring(pivot, index))
    }
    return final.join("")
}
export function getTimezoneOffset() {
    let offset = String(-new Date().getTimezoneOffset() / 60)
    if (offset.length === 1) {
        offset = "+" + offset
    }
    offset = offset[0] + offset[1].padStart(2, '0')
    return offset
}

export function GroupBy(listData, func) {
    let res = {};
    let getterKey = ""
    if (typeof func !== "function") {
        getterKey = func;
        func = (record) => record[getterKey] 
    }
    for (let record of listData) {
        let key = func(record)
        if (key in res)
            res[key].values.push(record)
        else
            res[key] = {values: [record]}
    }
    return res
}