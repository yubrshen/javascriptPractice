// jQuery.noConflict();
// var doc_body  = $(document.body)? $(document.body):$$('body')[0];  
var doc_body  = $("body");

// No filtering of text to be read is done in textScope-UI.js

// Register to mouseup event, and add the hook to process it. 
// This is the very beginning of the extension.

// window.addEvent
// ('mouseup',
// window.mouseup(
doc_body.mouseup(
  function(event){
      var notifier = $('textScope_notifier'); // the little popup ear window to display the propmt to do textScope
      if (event.target.id !== 'textScope_notifier' && notifier){
          notifier.destroy();
      } else {
          // get the minimum enclosure of the selection gesture
          var text = getEnclosure();
          if (text.length){
              if (!notifier){
                  // var textScope_notif = new Element('div',{
                  //     id: 'textScope_notifier',
                  //     text: 'textSocpe this',
                  //     events: {
                  //         'click': function(event){
                  //             startReading(text);
                  //             return this.destroy(); 
                  //         }
                  //     }
                  // });

                  var textScope_notif = $('<div id="textScope_notifier"/>');
                  textScope_notif.text ('textSocpe this');
                  textScope_notif.appendTo (doc_body);
                  // define the call back function for the event click
                  textScope_notif.click (function(event){
                      startReading(text);
                      return this.destroy(); 
                  });
                  textScope_notif.css ('left', event.page.x + 30);
                  textScope_notif.css ('top', event.page.x - 50);

                  //$(doc_body).grab(textScope_notif);
                  // doc_body.append(textScope_notif);
                  // $(textScope_notif).setStyle('left', event.page.x + 30); 
                  // $(textScope_notif).setStyle('top',  event.page.y - 50);
                  // use jQuery to set style
              }
          }
      }
      return event;
  }
 );

var MEANINGFUL_SELECTION_LENGTH = 3; // the minimum length that textScope should be start working. 

function getEnclosure() {
    // based on selection
    // expand the selection into the minimum enclosure
    // return the resulted text
    var userSelection = window.getSelection();
    if (String(userSelection).length >= MEANINGFUL_SELECTION_LENGTH) {
        // intentional selection:
        var Range = userSelection.getRangeAt(0); // get the first range in the selection. 
        //TODO: figure out how to get all the ranges?
        // var Ancestor = Range.commonAncestorContainer; 
        // expand the Range
        Range.setStart(Range.startContainer, 0); 
        Range.setEnd(Range.endContainer, Range.endContainer.textContent.length); // express it as the length of the textContent of the endContainer
        return Range.toString();
        // return Ancestor.textContent; // The range should be selective to be the first element? to avoid the garbage
    }
    return "";
}

// get settings asynchronously, then based on the settings, to do the full textScope logic

function startReading(text){
    chrome.extension.sendRequest({command:'getSettings'}, 
                                 function(response){
                                     var settings = response.settings; 
                                     processText(text, settings);
                                 });
}

function processText(text, settings) {
    var wsize = window.getSize();
    var reader = TEXTSCOPE_TEXT_READER(text, settings);

    // layout for reading
    // use i-frame insteade of div to block the flash distraction
    var background = new Element('div', {
        id: 'textScope_background',
        style: format("width:{0}px;height:{1}px;", wsize.x, wsize.y), 
        events: {
            mousedown: function(){
                // when clicking on the area of the original page, quit textScope panels.
                $('textScope_panel').destroy();
                this.destroy();
                reader.stop();
            }
        }
    }
                                );
    var textScope = new Element('div', { 
        id: "textScope_panel"
        });

    var textScope_flushes = Element('div', {
        id: "textScope_flushes",
        events: {
            'click': function(event) {reader.pauseResumeToggle();
                                      return event;},
            // 'keydown': function(event) {reader.pauseResumeToggle();
            //                           return event;} // need to differentiate the space key from the page down and up key in order to keep thu functionality of page up and down
        }
    });

    // try to set the focus to this element. But not sure if it's working?
    // textScope_flushes_container.focus();

    // var reader_inner = Element('div', {
    //     id: "textScope_body",
    //     style: "font-size: 24px"         
    //     });

    var infopane = Element ('div', {
            id: "infopane"
        });

    // var progressbar = Element ('div', {
    //         id: "progressbar"
    //     });

    jQuery("#progressbar").progressbar({ value: 37 });

    var reader_buttons = Element('ul', {
        html: 
            "<li id='textScope_start'>start</li>"+
            "<li id='textScope_stop'>stop</li>"+
            "<li id='textScope_bigger'>bigger</li>"+
            "<li id='textScope_smaller'>smaller</li>"+
            "<li id='textScope_faster'>faster</li>"+
            "<li id='textScope_slower'>slower</li>"+
            "<li id='textScope_restart'>read-again</li>" + 
            "<li id='textScope_more_words'>more words</li>" + 
            "<li id='textScope_less_words'>less words</li>" +
            "<li id='textScope_quit'>quit</li>",
        id:'textScope_buttons'
    });
    
    // assemble div's
    
    doc_body.grab(background);
    doc_body.grab(textScope);
    textScope.grab(reader_buttons);
    textScope.grab(infopane);
    
    // textScope.grab(progressbar);
    textScope.grab(textScope_flushes);

    // install button functionality:

    $('textScope_bigger').addEvent('click', function(){
            var fontsize = parseInt($('textScope_flushens').getStyle('font-size'));
            $('textScope_flushens').setStyle('font-size', fontsize*1.1);
            reader.updateSettings();
        });
    $('textScope_smaller').addEvent('click', function(){
            var fontsize = parseInt($('textScope_flushens').getStyle('font-size'));
            $('textScope_flushens').setStyle('font-size', fontsize*0.9);
            reader.updateSettings();
        });
    $('textScope_faster').addEvent('click', function(){
            reader.aSpeedController.wpm += 20;
            reader.setSpeed();
        });
    $('textScope_slower').addEvent('click', function(){
            reader.aSpeedController.wpm = (reader.aSpeedController.wpm > 20)? reader.aSpeedController.wpm - 20: reader.aSpeedController.wpm;
            reader.setSpeed();
        });
    $('textScope_restart').addEvent('click', function(){
            reader.restart();
        });
    $('textScope_start').addEvent('click', function(){
            reader.start();
        });
    $('textScope_stop').addEvent('click', function(){
            reader.stop();
        });
    $('textScope_quit').addEvent('click', function(){
            $('textScope_panel').destroy();
            background.destroy();
        });

// add catching keyboard event to quit here.
// as a pre-condition, needs to make the panel the focus of keyboard evenet
// it might be possible to use focus() method to make it the focus:
    // $('textScope_quit').focus(); // no effect

    $('textScope_more_words').addEvent('click', function(){
            reader.more_words();
        });

    $('textScope_less_words').addEvent('click', function(){
            reader.less_words();
        });
    // BACKLOG: to add pause and resume button here

    // Start after all the layout is done.
    reader.start();
};

// Define the class for speed controller
// It should encapsulate the logic of speed control for various type of languages.
// At the moment, they are Chinese, and space segmented Latin languages. 
// The nuance is that Chinese needs to be read a lot faster than Latin.  

function SpeedController(wpm) {
    // wpm: words per seconds
    this.wpm = wpm; 
    this.interval = 60000/this.wpm; // the interval in milli-seconds to show a word
    this.wpmProjected = this.wpm;
    this.readingChinese = false; 
    this.CHINESE_INTERVAL_COEEFICIENT = 0.5; // Chinese can be a lot faster 
    this.update_interval = function(){
        this.interval = 60000/this.wpm;
        
        if (this.readingChinese) {
            this.interval = this.interval*this.CHINESE_INTERVAL_COEEFICIENT; 
            this.wpmProjected = this.wpm/this.CHINESE_INTERVAL_COEEFICIENT;
        } else {
            this.wpmProjected = this.wpm;
        }
    };
    this.update = function(whetherHasChinese) {
        this.readingChinese = whetherHasChinese;
        this.update_interval();
    };
}

var TEXTSCOPE_TEXT_READER = function(content, conf){
    this.conf = {};
    for (var item in conf){
        if (conf[item] !== undefined && conf[item] !== null){
            this.conf[item] = parseInt(conf[item]);
        }
    }

    this.aSpeedController = new SpeedController(this.conf.wpm);

    this.step = this.conf.words; // just initialized.
    
    this.AVERAGE_WORD_LENGTH = 3; // Also for English, the average word length is 5 character, but for Chinese, it's often of 4 characters. To make the cut more agressive, maket 3. 
    this.rawContent = content;
    // this.content = String(content).split(' ').filter(isnotnull);
    // alert("The value of this.step: " + this.step);
    // The above alert seems gte called twice. But the second time shows invalid this.step. 
    // It might be caused by asynchronous nature of event process, that there are duplicated events, that are not properly filtered out. 
    // The following return an array of structure with element of text and control
    this.content = decomposeText(this.rawContent, this.AVERAGE_WORD_LENGTH*this.step); 
    this.aSpeedController.update(textHasChinese); // textHasChinese is defined and updated in textScope.js
    
    this.flushes = [];
    this.idx = 0;
    this.timer = null;
    // this.elapsedTime; 
    this.startTime; 
    this.running = false;
    // this.interval = null;
    this.intervalsToWait = 1; // added by Yu Shen to reflect the delay for the previous displayed text
    this.probablyChinese = function(text) {
        var words = text.split(" ").length;
        if (words == 0) return true;
        if (words > 0) {
            if ((text.length/words) > 30) { // This is not likely English, thus, it might be Chinese text, as the average word length in Engilsh is less than 5
                return true;}
        }
        return false;
    };
    
    this.TOP_SENTENCE_DELAY = 3; // The multiple of sentence delay should be a function of the total sentence's length, not the length of the last segment!
    this.SENTENCE_DELAY = 3; 
    this.CLAUSE_DELAY = 2; 
    this.PARAGRAPH_DELAY = 5; 

    this.wordsFlashed = 0; 

    this.pauseTime = function(seg) {
        // based on the seg to determine how long it should pause
        var delta = 1; 
        switch (seg.control.endingCharacteristics) {
        case TOP_SENTENCE_ENDING:
            // alert("Top sentence!");
            this.pauseResumeToggle(); 
            delta = this.TOP_SENTENCE_DELAY;
            break;
        case SENTENCE_ENDING:
            // alert("Sentence end!");
            delta = this.SENTENCE_DELAY;
            break;
        case CLAUSE_ENDING:
            // alert("Clause end!");
            delta = this.CLAUSE_DELAY;
            break;
        case PARAGRAPH_ENDING:
            alert("Paragraph end!");
            delta = this.PARAGRAPH_DELAY;
            break;
        }
        return this.wordsCount(seg.text) + delta; 
    }

    this.wordsCount = function(text) {
        // DONE: to handle Chinese word count, needing to identify the texts are Chinese
        // We weren't interested in count of Asian words, we needed count of chars plus count of alphanumeric words.
        var charArray=text.match(/\w+|[^.,\uFF10-\uFF19, \uFF9E, \uFF9F ]/g); 
        return (charArray) ? charArray.length : 0;
    };

    this.wordsTotal = this.wordsCount(this.rawContent);
    this.next = function(){
        var segment = this.content[this.idx]; // use the decomposed segments, not just the space seperated words.
        this.idx ++;
        if (segment === undefined || segment === null){
            this.running = false;
            return null;
        }
        return segment;
    };

    this.more_words = function(){
        this.step += 1;
        // disable the new segmentation in order to implement pause without recalculation of the current reading pointer. 
        // this.content = decomposeText(this.rawContent, this.AVERAGE_WORD_LENGTH*this.step); // modified by Yu Shen to implement semantics based segmentation. 
        // this.update_interval();
        this.updateSettings();
    };

    this.less_words = function(){
        this.step = (this.step >= 2)? this.step -1: 1;
        // disable the new segmentation in order to implement pause without recalculation of the current reading pointer. 
        // this.content = decomposeText(this.rawContent, this.AVERAGE_WORD_LENGTH*this.step); // modified by Yu Shen to implement semantics based segmentation. 
        // this.update_interval();
        this.updateSettings();
    };

    this.pauseResumeToggle = function () {
        // alert("Mouse click event captured!")
        if (this.running) {
            this.stop();
            this.flush(0); // flush out all the segments so far
        } else {
            this.restart();
        }
    }

    this.restart = function(){
        clearInterval(this.timer);
        // this.idx = 0;
        // this.running = false;
        // clear the flushes
        this.flushes.forEach(function(seg, index, segs) {seg.textContent = "";});
        return this.start();
    };

    this.setSpeed = function(arg){
        clearInterval(this.timer);
        this.running = false;
        this.aSpeedController.update_interval();
        this.updateSettings();
        return this.start();
    };

    this.checkByInterval = function(){
        this.intervalsToWait--; // check to see if we should flush new segment or not. 
        if ( this.intervalsToWait <= 0) {
            var hede = this.next();
            if (hede === null){
                // $('textScope_flushens').textContent = "";
                this.flush();
                return this.stop();
            } 
            this.wordsFlashed += this.wordsCount(hede.text);
            this.flush(this.idx);
            this.displaySettings();
            this.intervalsToWait = this.pauseTime(hede);
        }
    }
    // Ideas on how to implemest pause and resume, use a state of this.pause if it's true, then, in the interval do nothing, if not, continue as usual
    // At the time of pause, shows the content in total in a seperate window. 
    // Need to figure out how to make the windows not being destroyed when navigating to the content window.
    
    this.startLabel = "Start"; 
    this.stopLabel = "Stop";

    this.start = function(){
        if (this.running){
            return;
        }
        this.running = true;
        // show the status changed to READING and highligh it
        var startButton = $('textScope_start');
        this.startLabel = startButton.textContent;
        startButton.style.cssText ="background-color: #eee";
        startButton.textContent = 'READING';
        $('textScope_stop').style.cssText ="background-color: #ddd";
        $('textScope_stop').textContent = this.stopLabel; 
        this.intervalsToWait = 1;
        this.wordsFlashed = 0;
        this.startTime = new Date();
        this.timer = setInterval(this.checkByInterval, this.aSpeedController.interval); 
        // as setInterval does allow changing the interval in the middle. 
        // return this.displaySettings();

        // Every DOM node provides a focus method but most nodes have a tabIndex of -1 
        // which prevents the element from being focused on when clicked, tabbed, focused via JavaScript. 
        $('textScope_flushes').tabIndex = 0; 
        $('textScope_flushes').focus();
    };

    this.flush = function(start, end) {
        if (start == undefined) start = 0;
        if (end == undefined) end = this.idx;
        var i=0;
        var addOneSegmentLine = function (seg, index, segs) {
            // for each segment create its own div, place it at the proper place, and feed text to it. 
            var idflush = "textScope_flush_" + index;
            var reader_flush = $(idflush);
            if (!reader_flush) {
                reader_flush = Element('div', 
                                       {
                                           id: idflush,
                                           styles: {//'font-size': fontSize, // '1.5em', // experiment variable font size
                                               //'font-weight': '900',
                                               //'margin-top': '15px',
                                               'margin-bottom': '5px',
                                               'margin-left': '5px',
                                               //'padding': '10px', // it seems that padding does not help much
                                               'display': 'block'
                                           }
                                       });
                this.flushes.push(reader_flush);
                // $('textScope_flushes').grab(reader_flush); 
                $('textScope_flushes').grab(reader_flush); 
            } 
            
            var fontSize = (start) ? (((index + 1)*1.5/segs.length)*100 + '%') : '100%';
            reader_flush.setStyle('font-size', fontSize);
            var fontWeight = (start) ? (((index - 1) == segs.length) ? 'bold' : 'lighter') : 'normal';
            reader_flush.setStyle('font-weight', fontWeight);
            reader_flush.innerHTML = "<pre>" + seg.text + "</pre>"; // preserve the newlines using preformated tag
            // seg = seg.replace(/\n/g, "<br/>");
            // reader_flush.textContent = seg; // textContent would support any HTML tags.
            // reader_flush.innerHTML = seg; // must use innerHTML in order to take advantage of HTML tags for formats.
        };
        var previous = (start - 2) > 0 ? (start - 2) : 0;
        var toShow = (start) ? this.content.slice(previous, start) : this.content.slice(0, end);
        toShow.forEach(addOneSegmentLine);
    };

    this.stop = function(){
        clearInterval(this.timer);
        // provide the feedback of benig stopped state
        $('textScope_start').style.cssText ="background-color: #ddd";
        $('textScope_start').textContent = this.startLabel; 
        $('textScope_stop').style.cssText ="background-color: #eee";
        this.stopLabel = $('textScope_start').textContent;
        $('textScope_stop').textContent = "STOPPED"; 
        this.running = false;
    };

    this.updateSettings = function(){
        settings = {
            /* words per minute */
           'wpm': this.aSpeedController.wpm, 
           'words': parseInt(this.step),
           'font': parseInt($('textScope_flushes').getStyle('font-size'))
        };

        this.displaySettings();
        chrome.extension.sendRequest({command: 'saveSettings', settings_data: settings});
    };

    // BACKLOG: need to add pause/resume here
    this.displaySettings = function(){
        var currentTime = new Date();
        var elapsedTime = (currentTime - this.startTime)/(1000*60); // the difference is in milliseconds, convert it to minutes
        $('infopane').textContent = 
            format('{0} wpm projected / {1} wpm actual / {2} words per flash / {3} words read / {4} words total / {5}px fonts', 
                   this.aSpeedController.wpmProjected, (elapsedTime > 0) ? Math.round(this.wordsFlashed/elapsedTime):0, 
                   this.step, this.wordsFlashed, this.wordsTotal, parseInt($('textScope_panel').getStyle('font-size')));
    };

    // this.update_interval(); // may want to defer the deocmposition here.
    // this.start(); // Calling start here does not work. if this works, I might use the spot for start for pause/resume
    return this;
};

// Every DOM node provides a focus method but most nodes have a tabIndex of -1 which prevents the element from being focused on 
// when clicked, tabbed, focused via JavaScript.  
// In the end I came up with more of a shortcut method than anything else.

// Element.implement({
//   setFocus: function(index) {
//     this.setAttribute('tabIndex',index || 0);
//     this.focus();
//   }
// });

// Using this method is simple:
// $('myDiv').setFocus();

function format(){
    var formatted_str = arguments[0] || '';
    for(var i=1; i<arguments.length; i++){
        var re = new RegExp("\\{"+(i-1)+"}", "gim");
        formatted_str = formatted_str.replace(re, arguments[i]);
    }
    return formatted_str;
}

// obsoleted: 
// function isnotnull(hede){
//     return (hede != '' && hede !== null && hede !== undefined)? hede: null;
// }