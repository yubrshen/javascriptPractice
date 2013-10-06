var flushes = [];
var averageCharacterPerWord = 5; // based web literature. 
function reset () { // strange the function name clear does not work. It seems that this name might have been reserved by somewhere. 
    var textToRead = $('textToRead');
    textToRead.value = "";}

function read() {
    // get the text from the clipborad, and feed it into the textToRead, then get its text, then do the decomposition, and show the result.
    flushes.forEach(function(seg, index, segs) {seg.textContent = "";});
    var textToRead = $('textToRead');
    // textToRead.value = ""; // clear the current content
    // PastedText = textToRead.createTextRange();
    // PastedText.execCommand("Paste");
    // textToRead.value = PastedText; // content from clipboard
    var decomposed = textToRead.value;
    var settings = {
        'wpm': 330,
        'words': 2,
        'font': 30
    };
    processText(decomposed, settings);
}
function readSegmentationOnly() {
    // get the text in the textToRead, then get its text, then do the decomposition, and show the result.
    flushes.forEach(function(seg, index, segs) {seg.textContent = "";});
    var textToRead = $('textToRead');

    var numberOfWords = $(wordsPerSegment).value; // get it from input box. 
    var decomposed = decomposeText(textToRead.value, numberOfWords);
    var reader_flushes = new Element('div', {
                    id: "textScope_flushes",
                    style: "position: fixed; top: 0; right: 0; width:30%; height:100%;"});
    doc_body.grab(reader_flushes);
    if (decomposed) {
        var addOneSegmentLine = function (seg, index, segs) {
            // for each segment create its own div, place it at the proper place, and feed text to it. 
            if (!flushes[index]) {
                var idflush = "flush_" + index;
                var reader_flush;
                reader_flush = new Element('pre', 
                                       {
                                           id: idflush,
                                           style: {'font-size': '1.5em',
                                                   'margin-top': '5px',
                                                   'margin-left': '5px'
                                           }
                                       });
                flushes.push(reader_flush);
                reader_flushes.grab(reader_flush); 
            } 
            reader_flush.textContent = seg;
        };
        decomposed.forEach(addOneSegmentLine);
    }
}



function test(){
    decomposeChinese();
    decomposeLeadingPattern();
    nonEndingCase()
        endingCase();
    exhaustiveCase();
    tooShortCase();
    // realTextCaseForSentenceEndings();
    // decomposeSegmentsByComma();
} 

function exhaustiveCase() {
    console.log("exhaustive case:");
    var pat = /aaa|BBB/;
    var sample = "Something before, some other before";
    var segments = decompose(pat, sample);
    display(segments);
}

function tooShortCase() {
    console.log("tooShort case:");
    var pat = /aaa|BBB/;
    var sample = "Something before aaa";
    var segments = decompose(pat, sample, 100);
    display(segments);
}

function endingCase() {
    console.log("ending case:");
    var pat = /aaa|BBB/;
    var sample = "Something before aaa, some other before BBB";
    var segments = decompose(pat, sample);
    display(segments);
}

function nonEndingCase() {
    console.log("nonEnding case:");
    var pat = /aaa|BBB/;
    var sample = "Something before aaa, some other non-matching stuff";
    var segments = decompose(pat, sample);
    display(segments);
}

function realTextCaseForSentenceEndings () {
    console.log("Real text for seentence endings case:");
    var pat = /[\.\!\?]+/;
    var sample = "JavaScript supports \"return\" statements to allow functions to return values back to calling expressions. Here are some basic rules on the return value from a function. If no return statement is used in a function, the calling expression will receive a special value: \"undefined\". If the return value is a primitive value, the calling expression will receive a copy of the return value. If the return value is an object reference, the calling expression will receive a copy of the object reference.";
    var segments = decompose(pat, sample);
    display(segments);
}

function decomposeSegmentsByComma() {
    console.log("Real text for seentence and pharse endings case:");
    var pat = /[\.\!\?]+/;
    var sample = "JavaScript supports \"return\" statements to allow functions to return values back to calling expressions. Here are some basic rules on the return value from a function. If no return statement is used in a function, the calling expression will receive a special value: \"undefined\". If the return value is a primitive value, the calling expression will receive a copy of the return value. If the return value is an object reference, the calling expression will receive a copy of the object reference.";
    var segments = decompose(pat, sample);
    pat = /[:,;]|--/;
    segments = decomposeSegments(pat, segments);
    display(segments);
}

function decomposeLeadingPattern() {
    console.log("Real text with leading pattern case:");
    // var sample = "to allow functions to return values back to calling expressions.";

    // var sample = "JavaScript supports \"return\" statements to allow functions to return values back to calling expressions. \nHere are some basic rules on the return value from a function. \nIf no return statement is used in a function, the calling expression will receive a special value: \"undefined\". \nIf the return value is a primitive value, the calling expression will receive a copy of the return value. \nIf the return value is an object reference, the calling expression will receive a copy of the object reference.";
    var sample = "The Element object gets a LOT of love in MooTools. Most of the functions in the Element object are pretty self explanatory. Element.getTag does what you'd think it would.";

    // var sample = "\“Seamless mobility\” is a trendy industry buzz phrase, promoted by Motorola, Microsoft, Intel and many others. Any content available on any device across any network…sounds magical! Often this idea arises in discussions of fixed-mobile convergence. Yet systems that successfully span fixed and mobile are usually not seamless at all. On the contrary, fixed and mobile remain distinct, each optimized for its own constraints. Consider two highly successful systems, the Apple iPod and the RIM BlackBerry.First, neither system attempts to create a universal experience for accessing any content. On the contrary, each is optimized for a particular compelling experience, listening to music or podcasts on the iPod, and tending to business email on the Blackberry. Each experience is concrete and easy to understand, not abstracted into universal techno-speak. “Listening to music” and “tending to email” are much more tangible than “a new world where consumers are mobile, informed, entertained, secured, connected and empowered” (sorry, Motorola). Future examples might include “watching television,” “playing games” or “attending meetings.” Focus on experience seems central to Apple and RIM’s success. Second, neither attempts to create an identical, “seamless” fixed and mobile experience. Using an iPod is different than using iTunes, and using a Blackberry is different than using Outlook. And the experiences should be different. With iTunes and Outlook, the user is sitting down, gazing at a full screen, and using both hands on a keyboard and mouse. With an iPod or Blackberry, the user is on the move, glancing at a small screen, and often using only one thumb on small buttons. Rather than seamless, these experiences are coherent. They are the same in ways that make sense, and they are different in ways that make sense. My songs and podcasts in iTunes also appear on my iPod. When I delete email on my Blackberry, it’s also deleted when I look in Outlook. Much of the art of such systems goes into designing every detail correctly, maintaining this coherence. Hand-waving about “seamlessness” neglects these all-important details. Finally, the coherence of each system flows from a single source of definitive data. For the iPod, that source (of song files) resides on my Mac or PC with iTunes, and coherence is maintained through syncing the iPod periodically. For the Blackberry, that source (of emails) resides on my Exchange server, and coherence is maintained through the cellular data network. As Internet connections become faster and more ubiquitous, I expect that such sources will increasingly reside “in the cloud,” that is, in professionally maintained data centers, rather than a personal computer (more like the BlackBerry than like the iPod). That way, maintenance and back-ups don’t burden the user, and data stays current rather than drifting into obsolescence between syncs (particularly noticeable with podcast subscriptions). In fact, if I were the Microsoft Zune product manager, I’d shift towards the cloud model and away from the sync model, in an effort to differentiate from its current imitation-iPod positioning. Both these examples require specialized mobile devices, but with the emergence of more open mobile devices, perhaps developers will create new experiences on such platforms instead. Either way, the key question is not whether they support seamless mobility, but rather whether they create a coherent experience. With offerings from big companies, like Cisco’s Unified Mobile Communicator and Qualcomm’s MediaFLO, to start ups, like MobiTV and Danger, users have many new experiences to try.";
        
    var segments = decomposeText(sample, 5);
    display(segments);
}

function decomposeChinese() {
    console.log("Chinese text case:");
    var sample = "Blue Berry项目是UT与国家宣传机构合作的拟在全球部署，基于互联网环境提供音视频服务及增值服务的项目。项目要求UT在2010年底之前，提供可以正式商用的，可以适用于互联网环境的P2P CDN、支持P2P及Android平台的STB、广告运营平台、增值业务平台、以及包括视频通信、视频播客、电子出版物、TVMS、Widget等多种业务或应用。"
        var segments = decomposeText(sample, 10);
    display(segments);
}