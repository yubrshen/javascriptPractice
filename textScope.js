// The percentage of the range consider to be near to the center of a segment.
var CENTER_ZONE_RANGE = 0.8; 

var paragraphEnding = /^.+\n\n+/;
var sentenceEndings = /\S{1,4}(([\.\!\?]+\s+)+|\([^)(]+\)\S*\s*|([。？！]+\s*))/; // \S{2,4} works, but has some negative impact.
// adding space into the combination of sentence ending punctuations. 
// escape the parenthis enclosure from the '.' segmentation
var clauseEndings = /([:,;]|['"])+\s+|[—、，；：,﹐]+/; // remove '-' 
//([:,;]|['"])+\s+|(--|—|[、，；：,，﹐，])+/; // \S{2,} works, but need to test.{5,} does not work for Chinese text. 
var phraseBeginningsStrict = /[—“]+|[(]\S{5,}|[-]{2,}/; // note '-' can not be in between of charcters or it will be interpreted as in '[a-b]'
var BRUTALcutCOEFFICIENT = 1.5; // to make this a customization, encourage only very long word to be cut brutally at the end
var textHasChinese = false; // state whether the text has Chinese or not. 

function FlashControl (endingCharacteristics, offset) {
    this.endingCharacteristics = endingCharacteristics;
    this.offSet = offset;; // offset from the beginning of the content of the session
}

var PARAGRAPH_ENDING = 1;
var SENTENCE_ENDING = 2; 
var TOP_SENTENCE_ENDING = 3; 
var CLAUSE_ENDING = 4; 

function Segment(text, control) {
    this.text = text;
    this.control = control;}

// returns an array of structure with text and control information
function decomposeText(text, maximumSegLength) {
if (text && (text !="")) {
    var oldSegmentsLength = 0; 
    textHasChinese = false;
    // clean up the text for excessive newline and white spaces
    var patternToReplace = /\s*\n+\s*([a-z]+)/g;
    text = text.replace (patternToReplace, " $1");

    var control = new FlashControl (null, text.length);
    var segment = new Segment(text, control);

    var segments = decompose(paragraphEnding, segment, maximumSegLength, true, true, true, false);
    segments.forEach (function (seg, index, array) {seg.control.endingCharacteristics = PARAGRAPH_ENDING});

    segments = decomposeSegments(sentenceEndings, segments, maximumSegLength, true, true, true, false);
    segments.forEach (function (seg, index, array) 
                      {if (seg.control.endingCharacteristics == null)
                          seg.control.endingCharacteristics = SENTENCE_ENDING});

    segments[0].control.endingCharacteristics = TOP_SENTENCE_ENDING; 
 
    segments = decomposeSegments(clauseEndings, segments, maximumSegLength, true, true, true, false);
    segments.forEach (function (seg, index, array) 
                      {if (seg.control.endingCharacteristics == null)
                          seg.control.endingCharacteristics = CLAUSE_ENDING});

    // console.log(clauseBiginnings);
    segments = decomposeSegments(clauseBiginnings, segments, maximumSegLength, false, true, false, true);

    // For Chinese, make the maximumSegLength half to encourage more segmentation
    oldSegmentsLength = segments.length; 
    segments = decomposeSegments(clauseChineseBeginning, segments, maximumSegLength/2, false, true, true, false);
    if (segments.length > oldSegmentsLength) textHasChinese = true;
    
    segments = decomposeSegments(phraseBeginningsStrict, segments, maximumSegLength, false, true, false, true);
    segments = decomposeSegments(phraseBeginnings, segments, maximumSegLength, false, false, false, true);
    //console.log(phraseEndings);
    segments = decomposeSegments(phraseEndings, segments, maximumSegLength, true, false, true, true);

    oldSegmentsLength = segments.length;
    // console.log(phraseChineseBeginning);
    segments = decomposeSegments(phraseChineseBeginning, segments, maximumSegLength/2, false, false, true, false);
    if (segments.length > oldSegmentsLength) textHasChinese = true;

    segments = decomposeSegments(keyWord, segments, maximumSegLength, true, false, false, false);

    oldSegmentsLength = segments.length;
    // console.log(phraseChineseEnding);
    segments = decomposeSegments(phraseChineseEnding, segments, maximumSegLength/2, true, false, true, false);
    if (segments.length > oldSegmentsLength) textHasChinese = true;

    // try to use phrase beginning as ending, to further cut down the segments.
    // using begiing phrase as the ending cut, by implementing the ending cut directly when scan the beginning phrase. 
    // It seems too severe the following, cutting too segmented text. Relax not to be agressive. 
    segments = decomposeSegments(phraseBeginnings, segments, maximumSegLength, true, false, false, true);

    // BACKLOG: cutting by key noun. (Need to be able to identify the noun)
    // Here there should be mechanism of segmentation by key noun in a phrase, for example in the followiing:
    // write simple little recipes 
    // the key noun is 'recipes'
    // it would be great if I can find the key noun automatically so that I can cut accordingly. 

    // last resort to segment by English words, might able to segment Chinese text by English words among the Chinese
    var latinWord = new RegExp("[.’!`',;:\"\\w-]+\\s*"); // latin text plus punctuation
    // grab the trailing space to make the next line not indent
    segments = decomposeSegments(latinWord, segments, Math.round(BRUTALcutCOEFFICIENT*maximumSegLength), true, false, false, false); // add allowance of segment length in final cut
    return segments; 
} else 
return undefined;
}

function convertTokenToRe(tokenArray, nonLatin, ending) {// convert an array of tokens into regular expression with alternatives of the tokens. 
    var strBuf =""; 
    // sort the array put the longer first, in the hope for them to be matched earlier
    var revereSort = function(a, b) {
        return (b.length - a.length);
    };
    tokenArray.sort(revereSort);

    var packageToken = function(token, index, tokenArrayPtr) {
        if (nonLatin) {
            // strBuf = strBuf.concat("|", token, "(\\w+|[^.,\uFF10-\uFF19, \uFF9E, \uFF9F ]{0,2})"); 
            // consider all legal combinations after nonLatin beginnigs
            strBuf = strBuf.concat("|", token, "[^.,\uFF10-\uFF19, \uFF9E, \uFF9F ]*"); 
            // remove \\w+| as it's redundant, and make the full non blank, and non-puntuation match, 
        } // with nonLatin text, the word boundary does not work as the boundary of Chinese character
        else if (ending) { // ending pattern
            strBuf = strBuf.concat("|", "\\S+\\s+", "\\b", token, "\\b\\s+");} // make the ending pattern real, make sure that the pattern ends with space
        // keep in the ending pattern the trailing space \\s+
        else { // leading patten
            strBuf = strBuf.concat("|", "\\b", token, "\\b", "\\s+\\S+\\s*"); // make the leading pattern real. 
            // in the leading pattern, add \\s* at the end to absorb the space in the leading pattern, so that it will not appear at the beginning of the next segment.
        }
    };
    tokenArray.forEach(packageToken);
    return new RegExp(strBuf.substring(1), "im"); // create the regular expresnion, pop out the first |, which is not needed.
}

function decomposeSegments(pat, segments, maximumSegLength, ending, strict, agressive, lookingSpaceSegmentedText) {
    // apply decompose to every segment of the segments
    var newSegments = []; 

    var decomposeSegment = function (segment, index, array) {
        var decomposed = [];
        try {
            if (segment.text.length > maximumSegLength) {
                decomposed = decompose(pat, segment, maximumSegLength, ending, strict, agressive, lookingSpaceSegmentedText);}
            else {
                decomposed[0] = segment;}
        } catch (e) {
            decomposed[0] = segment; // safe no operation
            // BACKLOG: log on the error happening
        }
        newSegments = newSegments.concat(decomposed);
    }
    segments.forEach(decomposeSegment);
    return newSegments;
}

// function decompose(pat, segment, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText)
// parameters
// pat: regular express
// segment: segment to be decomposed, which has an attribute of text, and control
// maximumSegLength: the maximum length of segment, not to be decomposed
// I'm wondering if I should intepret maximumSegLength as the judgement for the accumulated segment length so far scanned, and segmented?
// It should be the so far accumulated, as the essence is to control the length a segment not to be too long.

// endingPattern: boolean, to indicate whether the patten is ending or not
// strict: whether the pattern should be followed strictly regardless of the segmentation length
// agressive: if true, cut after not ending phrase as well, when the phrase beginning is 0, or the matched patten is long enough. 

// lookingSpaceSegmentedText is not being used. 
// return: array of (decomposed) text segments. 

function decompose(pat, segment, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText) {
    // handle undefined parameters
    if (maximumSegLength == undefined)  maximumSegLength = AVERAGE_WORD_LENGTH;
    if (endingPattern == undefined) endingPattern = true;
    if (strict == undefined) strict = true; 

    // do decomposition here
    var segments = []; // creating array
    var rest;
    var cuttingPoint; // the point to cut the string txt, due to the recursive calling nature of the routine, the cutting is always relative to 0, the very starting point of txt.
    var newSearchStart = 0; // the next starting point for pattern scan
    var done = false; 

    // escape for the phrase short enough
    if (segment.text.length < maximumSegLength*BRUTALcutCOEFFICIENT) {
        segments[0] = new Segment(segment.text, segment.control);
        return segments;
    }

    while (!done) {
        // if (strict || ((segment.text.length - newSearchStart) > maximumSegLength)) {// strict or remaining words are long enough 
        if (strict || (segment.text.length > maximumSegLength)) {// strict or the total to be segmented is long enough, as it's recursive, so the total segment.text length would be considered.
            var search = searchFull(pat, segment.text, newSearchStart);
                if (search) {// Found a pattern
                    // determine the cutting point
                    cuttingPoint = (endingPattern) ? search.end : search.start;
                    // BACKLOG: to handle the match itself is longer than the maximumSegLength
                    if (strict) {
                        // done = true;
                        segments[0] = new Segment(segment.text.substring(0, cuttingPoint), 
                                                  (cuttingPoint < segment.text.length) ? (new FlashControl(null, segment.control.offset)) : segment.control);
                        if (cuttingPoint < segment.text.length) { // only if there is more to cut
                            var restSeg = new Segment(segment.text.substring(cuttingPoint), segment.control); 
                            rest = decompose(pat, restSeg, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText);
                            segments = segments.concat(rest);
                        }
                        break;
                    }
                    if (agressive && 
                        (cuttingPoint < maximumSegLength) &&  // for the case that the cutting point should be modified to the ending point
                        // (search.match.length >= AVERAGE_WORD_LENGTH) &&
                        (search.match.length <= maximumSegLength)) // not too long 
                        {// cut agressively with the ending point
                            cuttingPoint = search.end;
                    } else if ((cuttingPoint == newSearchStart) || 
                               ((!strict) && (cuttingPoint < maximumSegLength))) { // evaluate whether the cutting point is appropriate
                        newSearchStart = newSearchStart + maximumSegLength;
                        continue; // search further, regardless of leading or ending pattern, search beyond the search.end
                    }
                    // the cutting point is almost desirable
                    done = true;
                    if (cuttingPoint > (segment.text.length - 0.3*maximumSegLength)) { 
                        // if the cuttingPoint is at the end or 2 characters plus space near the end, then the cutting is not helpful
                        segments[0] = new Segment
                        //(segment.text, 
                        (segment.text.substring(0, cuttingPoint), 
                         (cuttingPoint < segment.text.length) ? (new FlashControl(null, segment.control.offset)) : segment.control);
                                                  // (cuttingPoint < segment.text.length)? null:segment.control);
                    } else {// really meaningful cutting point
                        // for the non strict case, cuttingPoint should be large than or equal to maximumSegLength
                        segments[0] = new Segment(segment.text.substring(0, cuttingPoint), 
                                                  (cuttingPoint < segment.text.length) ? (new FlashControl(null, segment.control.offset)) : segment.control);
                                                  //(cuttingPoint < segment.text.length)? null:segment.control);
                        if (agressive && 
                            (search.match.length >= 0.6*maximumSegLength) && 
                            (search.match.length < 1.3*maximumSegLength) && 
                            (cuttingPoint < search.end)) { 
                            // the matched pattern itself is already very long, cut one more time
                            cuttingPoint = search.end; 
                            segments[1] = new Segment(search.match, new FlashControl(null, segment.control.offset));
                        } 
                        if (cuttingPoint < segment.text.length) { // only if there is more to cut
                            var restSeg = new Segment(segment.text.substring(cuttingPoint), segment.control); 
                            rest = decompose(pat, restSeg, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText);
                            segments = segments.concat(rest);
                        }
                        break;
                    }
                } else { // no match, give up for now
                    // done = true;
                    segments[0] = new Segment(segment.text, segment.control);
                    break;
                }
            } else { // short enough
            // done = true;
                segments[0] = new Segment(segment.text.substring(newSearchStart), segment.control);
            break;
        }}
    return segments;
}

function SearchResult() {
    this.start = 0;
    this.end = 0;
    this.match = "";
}
function searchFull(pattern, string, from) {
    // starting from the from point, search sting with pattern, returns the start, the end points relative to the beginning of the string, and the matched pattern.
    if (from == undefined) from = 0;
    var result = new SearchResult();
    var execArray;
    var strWorking; 
    strWorking = string.substring(from);
    execArray = pattern.exec(strWorking); 
    if (execArray) {
        result.start = execArray.index + from; // relative to the beginning of string
        result.match = execArray[0];
        // Why is it the firts match to be the match, as the search is also the first semantics
        // Note that the returned value of exec is an array of strings of all the matches possible. 
        // w3s school's tutorial is over simplified, thus misleading. Be aware of it. 
        result.end = result.start + (result.match).length; // relative to the beginning of string
        return result;
    } else 
        return undefined;
}

var clauseBiginnings = convertTokenToRe(clauseBiginningArray, false, false);
var phraseEndings = convertTokenToRe(phraseEndingArray, false, true);
var phraseBeginnings = convertTokenToRe(phraseBeginningArray, false, false);
var clauseChineseBeginning = convertTokenToRe(clauseChineseBeginningArray, true);
var phraseChineseBeginning = convertTokenToRe(phraseChineseBeginningArray, true);
var phraseChineseEnding = convertTokenToRe(phraseChineseEndingArray, true);
var keyWord = convertTokenToRe(keyWordArray, true);

// Debug support functions:

function debug(txt) {
    console.log(txt);
}

function display(segments) {
    // BACKLOG: with proper leading space, based on the level of the segments
    for (i in segments) {
        console.log(segments[i]);
    }
}