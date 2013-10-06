reset = ->
  textToRead = $("textToRead")
  textToRead.value = ""
read = ->
  flushes.forEach (seg, index, segs) ->
    seg.textContent = ""

  textToRead = $("textToRead")
  decomposed = textToRead.value
  settings =
    wpm: 330
    words: 2
    font: 30

  processText decomposed, settings
readSegmentationOnly = ->
  flushes.forEach (seg, index, segs) ->
    seg.textContent = ""

  textToRead = $("textToRead")
  numberOfWords = $(wordsPerSegment).value
  decomposed = decomposeText(textToRead.value, numberOfWords)
  reader_flushes = new Element("div",
    id: "textScope_flushes"
    style: "position: fixed; top: 0; right: 0; width:30%; height:100%;"
  )
  doc_body.grab reader_flushes
  if decomposed
    addOneSegmentLine = (seg, index, segs) ->
      unless flushes[index]
        idflush = "flush_" + index
        reader_flush = undefined
        reader_flush = new Element("pre",
          id: idflush
          style:
            "font-size": "1.5em"
            "margin-top": "5px"
            "margin-left": "5px"
        )
        flushes.push reader_flush
        reader_flushes.grab reader_flush
      reader_flush.textContent = seg

    decomposed.forEach addOneSegmentLine
test = ->
  decomposeChinese()
  decomposeLeadingPattern()
  nonEndingCase()
  endingCase()
  exhaustiveCase()
  tooShortCase()
exhaustiveCase = ->
  console.log "exhaustive case:"
  pat = /aaa|BBB/
  sample = "Something before, some other before"
  segments = decompose(pat, sample)
  display segments
tooShortCase = ->
  console.log "tooShort case:"
  pat = /aaa|BBB/
  sample = "Something before aaa"
  segments = decompose(pat, sample, 100)
  display segments
endingCase = ->
  console.log "ending case:"
  pat = /aaa|BBB/
  sample = "Something before aaa, some other before BBB"
  segments = decompose(pat, sample)
  display segments
nonEndingCase = ->
  console.log "nonEnding case:"
  pat = /aaa|BBB/
  sample = "Something before aaa, some other non-matching stuff"
  segments = decompose(pat, sample)
  display segments
realTextCaseForSentenceEndings = ->
  console.log "Real text for seentence endings case:"
  pat = /[\.\!\?]+/
  sample = "JavaScript supports \"return\" statements to allow functions to return values back to calling expressions. Here are some basic rules on the return value from a function. If no return statement is used in a function, the calling expression will receive a special value: \"undefined\". If the return value is a primitive value, the calling expression will receive a copy of the return value. If the return value is an object reference, the calling expression will receive a copy of the object reference."
  segments = decompose(pat, sample)
  display segments
decomposeSegmentsByComma = ->
  console.log "Real text for seentence and pharse endings case:"
  pat = /[\.\!\?]+/
  sample = "JavaScript supports \"return\" statements to allow functions to return values back to calling expressions. Here are some basic rules on the return value from a function. If no return statement is used in a function, the calling expression will receive a special value: \"undefined\". If the return value is a primitive value, the calling expression will receive a copy of the return value. If the return value is an object reference, the calling expression will receive a copy of the object reference."
  segments = decompose(pat, sample)
  pat = /[:,;]|--/
  segments = decomposeSegments(pat, segments)
  display segments
decomposeLeadingPattern = ->
  console.log "Real text with leading pattern case:"
  sample = "The Element object gets a LOT of love in MooTools. Most of the functions in the Element object are pretty self explanatory. Element.getTag does what you'd think it would."
  segments = decomposeText(sample, 5)
  display segments
decomposeChinese = ->
  console.log "Chinese text case:"
  sample = "Blue Berry项目是UT与国家宣传机构合作的拟在全球部署，基于互联网环境提供音视频服务及增值服务的项目。项目要求UT在2010年底之前，提供可以正式商用的，可以适用于互联网环境的P2P CDN、支持P2P及Android平台的STB、广告运营平台、增值业务平台、以及包括视频通信、视频播客、电子出版物、TVMS、Widget等多种业务或应用。"
  segments = decomposeText(sample, 10)
  display segments
flushes = []
averageCharacterPerWord = 5
