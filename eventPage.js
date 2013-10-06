
var defaults = {
                'wpm': 300,
                'words': 2,
                'font': 20
            };
// For the above, it seems that the default to be larger is better for
// more balanced segmentation. 

// use background to access user data, cookies
// BACKLOG: to add the saving of the tokens in cookies
    function getValue(item){
        var lsval = localStorage[item];
        if(lsval == null || lsval == undefined || lsval == "null"){
          return defaults[item];
        } 
      return lsval;
    };
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        var conf = {}
        if (request.command == 'getSettings'){
            for (var item in defaults){
                if (item == undefined){
                    break;
                }
                conf[item] = getValue(item);
            
            }
        }
        sendResponse({'settings':conf});
    });

    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        if (request.command == 'saveSettings'){
            var data = request.settings_data;
            for(var item in data){
                if(item == undefined ){
                    break;
                }
                localStorage[item] = data[item]
            }
        }
        sendResponse({});
    });
