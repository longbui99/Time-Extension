

const CSSFILE = [
    'libs/datepicker.css',
    'css/pin.css',
    'css/index.css',
]
const JSFILE = [
    'libs/datepicker.js',
    'js/app.js',
    'js/background/embedded.js',
]

export async function injectFile(params) {
    params.extensionID = chrome.runtime.id;
    function injectFunction(pr){
      let tm = document.getElementsByTagName('lbwt')[0]
      if (!tm){
        tm = document.createElement('lbwt');
        tm.classList.add('wt-class');
        document.body.parentElement.append(tm);
      }
      let object = mount(PinPopup, tm, pr);
    }
    async function checkExistedElement(){
        let element = await document.querySelector('.popup-container');
        let condition = { el: element === null,  func: typeof(PinPopup) === "undefined"}
        return condition
    }
    let [tab] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
    chrome.scripting.executeScript({
        target: { tabId: tab.id},
        function: checkExistedElement,
    }, async res=>{
        if (res){
            if (res[0].result.func){
              chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: CSSFILE,
              })
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: JSFILE,
              }, e => {
                if (res[0].result.el) {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: injectFunction,
                    args: [params]
                  })
                }
              })
            }
            else if (res[0].result.el) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: injectFunction,
                args: [params]
              })
              let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
              data.staticPinned = true;
              chrome.storage.local.set({ 'timeLogStorage': data })
            }
          }
    }
    )
}