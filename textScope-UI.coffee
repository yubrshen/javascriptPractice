getEnclosure = ->
  userSelection = window.getSelection()
  if String(userSelection).length >= MEANINGFUL_SELECTION_LENGTH
    Range = userSelection.getRangeAt(0)
    Range.setStart Range.startContainer, 0
    Range.setEnd Range.endContainer, Range.endContainer.textContent.length
    return Range.toString()
  ""
startReading = (text) ->
  chrome.extension.sendRequest
    command: "getSettings"
  , (response) ->
    settings = response.settings
    processText text, settings
processText = (text, settings) ->
  wsize = window.getSize()
  reader = TEXTSCOPE_TEXT_READER(text, settings)
  background = new Element("div",
    id: "textScope_background"
    style: format("width:{0}px;height:{1}px;", wsize.x, wsize.y)
    events:
      mousedown: ->
        if reader.running is true
          reader.pauseResumeToggle()
        else
          $("textScope_panel").destroy()
          @destroy()

      keydown: (event) ->
        reader.pauseResumeToggle()  if reader.running is true
        event
  )
  textScope = new Element("div",
    id: "textScope_panel"
  )
  textScope_flushes = Element("div",
    id: "textScope_flushes"
    events:
      click: (event) ->
        reader.pauseResumeToggle()
        event

      keydown: (event) ->
        if reader.running is true
          reader.pauseResumeToggle()
          event
  )
  infopane = Element("div",
    id: "infopane"
  )
  reader_buttons = Element("ul",
    html: "<li id='textScope_start'>start</li>" + "<li id='textScope_stop'>stop</li>" + "<li id='textScope_bigger'>bigger</li>" + "<li id='textScope_smaller'>smaller</li>" + "<li id='textScope_faster'>faster</li>" + "<li id='textScope_slower'>slower</li>" + "<li id='textScope_restart'>read-again</li>" + "<li id='textScope_more_words'>more words</li>" + "<li id='textScope_less_words'>less words</li>" + "<li id='textScope_quit'>quit</li>"
    id: "textScope_buttons"
  )
  doc_body.grab background
  doc_body.grab textScope
  textScope.grab reader_buttons
  textScope.grab infopane
  textScope.grab textScope_flushes
  $("textScope_bigger").addEvent "click", ->
    fontsize = parseInt($("textScope_flushens").getStyle("font-size"))
    $("textScope_flushens").setStyle "font-size", fontsize * 1.1
    reader.updateSettings()

  $("textScope_smaller").addEvent "click", ->
    fontsize = parseInt($("textScope_flushens").getStyle("font-size"))
    $("textScope_flushens").setStyle "font-size", fontsize * 0.9
    reader.updateSettings()

  $("textScope_faster").addEvent "click", ->
    reader.aSpeedController.wpm += 20
    reader.setSpeed()

  $("textScope_slower").addEvent "click", ->
    reader.aSpeedController.wpm = (if (reader.aSpeedController.wpm > 20) then reader.aSpeedController.wpm - 20 else reader.aSpeedController.wpm)
    reader.setSpeed()

  $("textScope_restart").addEvent "click", ->
    reader.restart()

  $("textScope_start").addEvent "click", ->
    reader.start()

  $("textScope_stop").addEvent "click", ->
    reader.stop()

  $("textScope_quit").addEvent "click", ->
    $("textScope_panel").destroy()
    background.destroy()

  $("textScope_more_words").addEvent "click", ->
    reader.more_words()

  $("textScope_less_words").addEvent "click", ->
    reader.less_words()

  reader.start()
SpeedController = (wpm) ->
  @wpm = wpm
  @interval = 60000 / @wpm
  @wpmProjected = @wpm
  @readingChinese = false
  @CHINESE_INTERVAL_COEEFICIENT = 0.5
  @update_interval = ->
    @interval = 60000 / @wpm
    if @readingChinese
      @interval = @interval * @CHINESE_INTERVAL_COEEFICIENT
      @wpmProjected = @wpm / @CHINESE_INTERVAL_COEEFICIENT
    else
      @wpmProjected = @wpm

  @update = (whetherHasChinese) ->
    @readingChinese = whetherHasChinese
    @update_interval()
format = ->
  formatted_str = arguments_[0] or ""
  i = 1

  while i < arguments_.length
    re = new RegExp("\\{" + (i - 1) + "}", "gim")
    formatted_str = formatted_str.replace(re, arguments_[i])
    i++
  formatted_str
doc_body = (if $(document.body) then $(document.body) else $$("body")[0])
window.addEvent "mouseup", (event) ->
  notifier = $("textScope_notifier")
  if event.target.id isnt "textScope_notifier" and notifier
    notifier.destroy()
  else
    text = getEnclosure()
    if text.length
      unless notifier
        textScope_notif = new Element("div",
          id: "textScope_notifier"
          text: "textSocpe this"
          events:
            click: (event) ->
              startReading text
              @destroy()
        )
        $(doc_body).grab textScope_notif
        $(textScope_notif).setStyle "left", event.page.x + 30
        $(textScope_notif).setStyle "top", event.page.y - 50
  event

MEANINGFUL_SELECTION_LENGTH = 3
TEXTSCOPE_TEXT_READER = (content, conf) ->
  @conf = {}
  for item of conf
    @conf[item] = parseInt(conf[item])  if conf[item] isnt `undefined` and conf[item] isnt null
  @aSpeedController = new SpeedController(@conf.wpm)
  @step = @conf.words
  @AVERAGE_WORD_LENGTH = 3
  @rawContent = content
  @content = decomposeText(@rawContent, @AVERAGE_WORD_LENGTH * @step)
  @aSpeedController.update textHasChinese
  @flushes = []
  @idx = 0
  @timer = null
  @startTime
  @running = false
  @intervalsToWait = 1
  @probablyChinese = (text) ->
    words = text.split(" ").length
    return true  if words is 0
    return true  if (text.length / words) > 30  if words > 0
    false

  @TOP_SENTENCE_DELAY = 3
  @SENTENCE_DELAY = 3
  @CLAUSE_DELAY = 2
  @PARAGRAPH_DELAY = 5
  @wordsFlashed = 0
  @pauseTime = (seg) ->
    delta = 1
    switch seg.control.endingCharacteristics
      when TOP_SENTENCE_ENDING
        @pauseResumeToggle()
        delta = @TOP_SENTENCE_DELAY
      when SENTENCE_ENDING
        delta = @SENTENCE_DELAY
      when CLAUSE_ENDING
        delta = @CLAUSE_DELAY
      when PARAGRAPH_ENDING
        delta = @PARAGRAPH_DELAY
    @wordsCount(seg.text) + delta

  @wordsCount = (text) ->
    charArray = text.match(/\w+|[^.,\uFF10-\uFF19, \uFF9E, \uFF9F -\/#!$%\^&\*;:{}=\-_`~()\n]/g)
    (if (charArray) then charArray.length else 0)

  @wordsTotal = @wordsCount(@rawContent)
  @next = ->
    segment = @content[@idx]
    @idx++
    if segment is `undefined` or segment is null
      @running = false
      return null
    segment

  @more_words = ->
    @step += 1
    @updateSettings()

  @less_words = ->
    @step = (if (@step >= 2) then @step - 1 else 1)
    @updateSettings()

  @pauseResumeToggle = ->
    if @running
      @stop()
      @flush 0
    else
      @restart()

  @restart = ->
    clearInterval @timer
    @flushes.forEach (seg, index, segs) ->
      seg.textContent = ""

    @start()

  @setSpeed = (arg) ->
    clearInterval @timer
    @running = false
    @aSpeedController.update_interval()
    @updateSettings()
    @start()

  @checkByInterval = ->
    @intervalsToWait--
    if @intervalsToWait <= 0
      hede = @next()
      if hede is null
        @flush()
        return @stop()
      @wordsFlashed += @wordsCount(hede.text)
      @flush @idx
      @displaySettings()
      @intervalsToWait = @pauseTime(hede)

  @startLabel = "Start"
  @stopLabel = "Stop"
  @start = ->
    return  if @running
    @running = true
    startButton = $("textScope_start")
    @startLabel = startButton.textContent
    startButton.style.cssText = "background-color: #eee"
    startButton.textContent = "READING"
    $("textScope_stop").style.cssText = "background-color: #ddd"
    $("textScope_stop").textContent = @stopLabel
    @intervalsToWait = 1
    @wordsFlashed = 0
    @startTime = new Date()
    @timer = setInterval(@checkByInterval, @aSpeedController.interval)
    $("textScope_flushes").tabIndex = 0
    $("textScope_flushes").focus()

  @flush = (start, end) ->
    start = 0  if start is `undefined`
    end = @idx  if end is `undefined`
    i = 0
    addOneSegmentLine = (seg, index, segs) ->
      idflush = "textScope_flush_" + index
      reader_flush = $(idflush)
      unless reader_flush
        reader_flush = Element("div",
          id: idflush
          styles:
            "font-size": "24px"
            "margin-bottom": "5px"
            "margin-left": "5px"
            display: "block"
        )
        @flushes.push reader_flush
        $("textScope_flushes").grab reader_flush
      fontWeight = (if (start) then (if ((index - 1) is segs.length) then "bold" else "lighter") else "normal")
      reader_flush.setStyle "font-weight", fontWeight
      reader_flush.innerHTML = "<pre id=preFormat>" + seg.text + "</pre>"

    previous = (if (start - 1) > 0 then (start - 1) else 0)
    toShow = (if (start) then @content.slice(previous, start) else @content.slice(0, end))
    toShow.forEach addOneSegmentLine

  @stop = ->
    clearInterval @timer
    $("textScope_start").style.cssText = "background-color: #ddd"
    $("textScope_start").textContent = @startLabel
    $("textScope_stop").style.cssText = "background-color: #eee"
    @stopLabel = $("textScope_start").textContent
    $("textScope_stop").textContent = "STOPPED"
    @running = false

  @updateSettings = ->
    settings =
      wpm: @aSpeedController.wpm
      words: parseInt(@step)
      font: parseInt($("textScope_flushes").getStyle("font-size"))

    @displaySettings()
    chrome.extension.sendRequest
      command: "saveSettings"
      settings_data: settings

  @displaySettings = ->
    currentTime = new Date()
    elapsedTime = (currentTime - @startTime) / (1000 * 60)
    $("infopane").textContent = format("{0} wpm projected / {1} wpm actual / {2} words per flash / {3} words read / {4} words total / {5}px fonts", @aSpeedController.wpmProjected, (if (elapsedTime > 0) then Math.round(@wordsFlashed / elapsedTime) else 0), @step, @wordsFlashed, @wordsTotal, parseInt($("textScope_panel").getStyle("font-size")))

  this
