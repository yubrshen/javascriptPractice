keyWordArray = [ "以太网", "诺基亚", "东软", "东软集团", "设备商", "互联网", "物联网", "[音]?视频", "数字电视", "交互业务", "播控", "平台", "集成播控平台", "三网融合", "中国\\W?", "美国\\W?", "New Testament", "Old Testament", "Carneige Melon", "digital age" ]
clauseBiginningArray = [ "\\w+'\\d", "had", "before", "after", "\\d* '", "\\d* \"", "\\d [A-Z]", "so(sthat)?", "such that", "who\\w*", "until", "till", "as if", "if", "provided", "because", "since", "even though", "furthermore", "or", "but", "hence", "thus", "while", "that", "which\\w*", "what\\w*", "how\\w*", "where\\w*", "when\\w*", "therefore", "nevertheless" ]
phraseBeginningArray = [ "《S{0,10}》", "『.{0,10}』", "be", "I", "all", "also", "of", "around", "\\(", "\\[.*\\]", "neither\\s+\\S+nor", "nor", "and", "such as", "as \\w+ as", "in\\s+order\\s+to", "his", "her", "my", "our", "their", "your", "the", "a[n]?", "bec[oa]me", "through", "any\\w*", "every\\w*", "rather than", "than", "between", "some\\w*", "here", "there", "has", "has been", "have been", "have", "having", "is", "was", "were", "are", "will", "shall", "should", "must", "would", "could", "can", "may", "might", "to\\w*", "as", "about", "for", "from", "by", "in\\w*", "on", "at", "with\\w*", "under\\w*", "above", "despite", "many", "much", "very", "a few", "few", "this" ]
phraseEndingArray = [ "up(on)?", "of", "you", "me", "him", "her", "their", "us" ]
phraseChineseEndingArray = [ "年内", "的", "地", "和", "及", "等", "与", "了", "得", "时" ]
clauseChineseBeginningArray = [ "[不]?喜欢", "[不太很]*介意", "[不而越]*是", "成为", "变成", "然后", "但[是]*", "自然而然", "然而", "以为", "而且", "尽管", "虽然", "因此", "所以", "因为", "如何", "什么", "何时", "那样", "难道", "比如", "好像", "仿佛", "似的", "也许", "不过", "如此", "是否", "会不会", "似乎", "结果", "如果", "假如", "并且", "或者", "万一", "然而", "可是", "就是", "或许", "尽管", "[而]*当[时]", "随着", "不仅", "反而", "直到", "无论", "不论", "仍然", "于是", "还要", "甚至", "正是", "原来", "既然", "即使", "如果" ]
phraseChineseBeginningArray = [ "应", "缺少", "完成", "受", "即可", "继续", "也", "\\W?能\\W?", "在\\W+处", "一般", "这", "东西", "到\\W?", "放在", "整体", "以至于", "基于", "势在", "已", "也有", "成为", "很难", "越\\W+越\\W+", "原则", "站在", "所有", "富有", "具有", "很有", "从\\W+始", "从\\W+到", "占", "了解", "超过", "“", "（", "《", "给", "作为", "仍是", "应对", "、\\W+等", "以\\W+来", "连\\W+也", "只要\\W+就", "重要", "要", "恢复", "取得了", "进一步", "首个", "作为", "用于", "现在", "这是", "集中在", "则", "在\\W+的", "有\\W*的", "在", "跟", "和", "并", "可\\W?", "以及", "与", "的", "成\\?", "为", "在\\W*时", "前往", "於\\W*方", "方式", "将", "前期", "目的", "对", "从", "从\\W*往", "从\\W*中", "向\\W*了", "以\\W*为", "赴", "到\\W?", "就", "于", "由", "以后", "[不]?应该", "认为", "要求", "提到", "提供", "拟在", "召集", "目的", "分开", "[以]?及", "很多", "尽最[大小]可能", "只有", "做一个" ]