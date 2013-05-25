FlashControl = (endingCharacteristics, offset) ->
  @endingCharacteristics = endingCharacteristics
  @offSet = offset
Segment = (text, control) ->
  @text = text
  @control = control
decomposeText = (text, maximumSegLength) ->
  if text and (text isnt "")
    oldSegmentsLength = 0
    textHasChinese = false
    patternToReplace = /\s*\n+\s*([a-z]+)/g
    text = text.replace(patternToReplace, " $1")
    control = new FlashControl(null, text.length)
    segment = new Segment(text, control)
    segments = decompose(paragraphEnding, segment, maximumSegLength, true, true, true, false)
    segments.forEach (seg, index, array) ->
      seg.control.endingCharacteristics = PARAGRAPH_ENDING

    segments = decomposeSegments(sentenceEndings, segments, maximumSegLength, true, true, true, false)
    segments.forEach (seg, index, array) ->
      seg.control.endingCharacteristics = SENTENCE_ENDING  unless seg.control.endingCharacteristics?

    segments[0].control.endingCharacteristics = TOP_SENTENCE_ENDING
    segments = decomposeSegments(clauseEndings, segments, maximumSegLength, true, true, true, false)
    segments.forEach (seg, index, array) ->
      seg.control.endingCharacteristics = CLAUSE_ENDING  unless seg.control.endingCharacteristics?

    segments = decomposeSegments(clauseBiginnings, segments, maximumSegLength, false, true, false, true)
    oldSegmentsLength = segments.length
    segments = decomposeSegments(clauseChineseBeginning, segments, maximumSegLength / 2, false, true, true, false)
    textHasChinese = true  if segments.length > oldSegmentsLength
    segments = decomposeSegments(phraseBeginningsStrict, segments, maximumSegLength, false, true, false, true)
    segments = decomposeSegments(phraseBeginnings, segments, maximumSegLength, false, false, false, true)
    segments = decomposeSegments(phraseEndings, segments, maximumSegLength, true, false, true, true)
    oldSegmentsLength = segments.length
    segments = decomposeSegments(phraseChineseBeginning, segments, maximumSegLength / 2, false, false, true, false)
    textHasChinese = true  if segments.length > oldSegmentsLength
    segments = decomposeSegments(keyWord, segments, maximumSegLength, true, false, false, false)
    oldSegmentsLength = segments.length
    segments = decomposeSegments(phraseChineseEnding, segments, maximumSegLength / 2, true, false, true, false)
    textHasChinese = true  if segments.length > oldSegmentsLength
    segments = decomposeSegments(phraseBeginnings, segments, maximumSegLength, true, false, false, true)
    latinWord = new RegExp("[.’!`',;:\"\\w-]+\\s*")
    segments = decomposeSegments(latinWord, segments, Math.round(BRUTALcutCOEFFICIENT * maximumSegLength), true, false, false, false)
    segments
  else
    `undefined`
convertTokenToRe = (tokenArray, nonLatin, ending) ->
  strBuf = ""
  revereSort = (a, b) ->
    b.length - a.length

  tokenArray.sort revereSort
  packageToken = (token, index, tokenArrayPtr) ->
    if nonLatin
      strBuf = strBuf.concat("|", token, "[^.,０-９, ﾞ, ﾟ ]*")
    else if ending
      strBuf = strBuf.concat("|", "\\S+\\s+", "\\b", token, "\\b\\s+")
    else
      strBuf = strBuf.concat("|", "\\b", token, "\\b", "\\s+\\S+\\s*")

  tokenArray.forEach packageToken
  new RegExp(strBuf.substring(1), "im")
decomposeSegments = (pat, segments, maximumSegLength, ending, strict, agressive, lookingSpaceSegmentedText) ->
  newSegments = []
  decomposeSegment = (segment, index, array) ->
    decomposed = []
    try
      if segment.text.length > maximumSegLength
        decomposed = decompose(pat, segment, maximumSegLength, ending, strict, agressive, lookingSpaceSegmentedText)
      else
        decomposed[0] = segment
    catch e
      decomposed[0] = segment
    newSegments = newSegments.concat(decomposed)

  segments.forEach decomposeSegment
  newSegments
decompose = (pat, segment, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText) ->
  maximumSegLength = AVERAGE_WORD_LENGTH  if maximumSegLength is `undefined`
  endingPattern = true  if endingPattern is `undefined`
  strict = true  if strict is `undefined`
  segments = []
  rest = undefined
  cuttingPoint = undefined
  newSearchStart = 0
  done = false
  if segment.text.length < maximumSegLength * BRUTALcutCOEFFICIENT
    segments[0] = new Segment(segment.text, segment.control)
    return segments
  until done
    if strict or (segment.text.length > maximumSegLength)
      search = searchFull(pat, segment.text, newSearchStart)
      if search
        cuttingPoint = (if (endingPattern) then search.end else search.start)
        if strict
          segments[0] = new Segment(segment.text.substring(0, cuttingPoint), (if (cuttingPoint < segment.text.length) then (new FlashControl(null, segment.control.offset)) else segment.control))
          if cuttingPoint < segment.text.length
            restSeg = new Segment(segment.text.substring(cuttingPoint), segment.control)
            rest = decompose(pat, restSeg, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText)
            segments = segments.concat(rest)
          break
        if agressive and (cuttingPoint < maximumSegLength) and (search.match.length <= maximumSegLength)
          cuttingPoint = search.end
        else if (cuttingPoint is newSearchStart) or (not strict) and (cuttingPoint < maximumSegLength)
          newSearchStart = newSearchStart + maximumSegLength
          continue
        done = true
        if cuttingPoint > (segment.text.length - 0.3 * maximumSegLength)
          segments[0] = new Segment(segment.text.substring(0, cuttingPoint), (if (cuttingPoint < segment.text.length) then (new FlashControl(null, segment.control.offset)) else segment.control))
        else
          segments[0] = new Segment(segment.text.substring(0, cuttingPoint), (if (cuttingPoint < segment.text.length) then (new FlashControl(null, segment.control.offset)) else segment.control))
          if agressive and (search.match.length >= 0.6 * maximumSegLength) and (search.match.length < 1.3 * maximumSegLength) and (cuttingPoint < search.end)
            cuttingPoint = search.end
            segments[1] = new Segment(search.match, new FlashControl(null, segment.control.offset))
          if cuttingPoint < segment.text.length
            restSeg = new Segment(segment.text.substring(cuttingPoint), segment.control)
            rest = decompose(pat, restSeg, maximumSegLength, endingPattern, strict, agressive, lookingSpaceSegmentedText)
            segments = segments.concat(rest)
          break
      else
        segments[0] = new Segment(segment.text, segment.control)
        break
    else
      segments[0] = new Segment(segment.text.substring(newSearchStart), segment.control)
      break
  segments
SearchResult = ->
  @start = 0
  @end = 0
  @match = ""
searchFull = (pattern, string, from) ->
  from = 0  if from is `undefined`
  result = new SearchResult()
  execArray = undefined
  strWorking = undefined
  strWorking = string.substring(from)
  execArray = pattern.exec(strWorking)
  if execArray
    result.start = execArray.index + from
    result.match = execArray[0]
    result.end = result.start + (result.match).length
    result
  else
    `undefined`
debug = (txt) ->
  console.log txt
display = (segments) ->
  for i of segments
    console.log segments[i]
CENTER_ZONE_RANGE = 0.8
paragraphEnding = /^.+\n\n+/
sentenceEndings = /\S{1,4}(([\.\!\?]+\s+)+|\([^)(]+\)\S*\s*|([。？！]+\s*))/
clauseEndings = /([:,;]|['"])+\s+|[—、，；：,﹐]+/
phraseBeginningsStrict = /[—“]+|[(]\S{5,}|[-]{2,}/
BRUTALcutCOEFFICIENT = 1.5
textHasChinese = false
PARAGRAPH_ENDING = 1
SENTENCE_ENDING = 2
TOP_SENTENCE_ENDING = 3
CLAUSE_ENDING = 4
clauseBiginnings = convertTokenToRe(clauseBiginningArray, false, false)
phraseEndings = convertTokenToRe(phraseEndingArray, false, true)
phraseBeginnings = convertTokenToRe(phraseBeginningArray, false, false)
clauseChineseBeginning = convertTokenToRe(clauseChineseBeginningArray, true)
phraseChineseBeginning = convertTokenToRe(phraseChineseBeginningArray, true)
phraseChineseEnding = convertTokenToRe(phraseChineseEndingArray, true)
keyWord = convertTokenToRe(keyWordArray, true)
