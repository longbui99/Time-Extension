

const CSSFILE = [
    'libs/datepicker.css',
    'css/pin.css',
    'css/index.css',
]
const JSFILE = [
    'libs/datepicker.js',
    'js/utils.js',
    'js/api.js',
    'js/base.js',
    'js/login.js',
    'js/main.js',
    'js/home.js',
    'js/embedded.js',
]

async function injectFile(params) {
    params.extensionID = chrome.runtime.id;
    function injectFunction(pr){
        let object = mount(PinPopup, document.body, pr);
      //   var evt = new MouseEvent("click", {
      //     view: window,
      //     bubbles: true,
      //     cancelable: true,
      //     clientX: 20,
      // });
      // object.el.dispatchEvent(evt);
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