// 话题库 + 预习卡内容。
// 轻松闲聊：从固定库里挑；挑战进阶：按你的标签推荐。
export type TopicCard = {
  title: string
  words: string[]
  phrases: string[]
  questions: string[]
  sample: string
  tips: string[]
  background: string
  followUps: string[]
}

export const TOPIC_CARDS: Record<string, TopicCard> = {
  最近一次旅行: {
    title: '最近一次旅行',
    words: ['trip', 'scenery', 'crowded', 'get away', 'book a ticket', 'local food'],
    phrases: [
      'I went to … for a few days.',
      'The thing I remember most is …',
      "I'd go back tomorrow if I could.",
    ],
    questions: ['Where did you go and who did you go with?', 'Was there anything you would do differently?'],
    sample:
      'Last spring I went to a small town near the mountains with two friends. We stayed for three days and mostly walked around. The thing I remember most is the morning market — it was noisy but the food was amazing. I would go back, but next time I would go on a weekday.',
    tips: ['trip 的 /tr/ 不要读成「吹」', 'scenery 重音在第一个音节'],
    background: '小城/小镇话题在英国口语里很常见，说具体细节比说形容词更容易听懂。',
    followUps: ['Would you go again?', 'Do you prefer cities or small towns?'],
  },
  你最近在追的剧: {
    title: '你最近在追的剧',
    words: ['episode', 'plot', 'character', 'hooked', 'recommend', 'binge-watch'],
    phrases: [
      "I'm three episodes in and already hooked.",
      'The plot is simple, but the acting carries it.',
      'No spoilers, I promise.',
    ],
    questions: ['What are you watching right now?', 'Would you recommend it to a beginner?'],
    sample:
      "I'm watching a crime series at the moment. I'm only three episodes in, but I'm already hooked. The plot is not very original, but the main character is really well written. I'd recommend it if you like slow stories.",
    tips: ['character 的 ch 读 /k/', 'hooked 结尾的 /t/ 要轻'],
    background: '聊剧最容易冷场在「剧名」——准备一句剧情概括比记住剧名更有用。',
    followUps: ['Who is your favourite character?', 'Do you watch with subtitles?'],
  },
  一个让你开心的周末: {
    title: '一个让你开心的周末',
    words: ['weekend', 'sleep in', 'hang out', 'unexpected', 'make my day', 'chill'],
    phrases: ['I slept in and then …', 'Out of nowhere, …', 'It still makes me smile.'],
    questions: ['What did you do last weekend?', 'What makes a weekend good for you?'],
    sample:
      'Last weekend I did almost nothing, and that was the point. I slept in, made a late breakfast, and then walked to a park nearby. Out of nowhere, I met a friend I had not seen for months. We just sat and talked for two hours.',
    tips: ['slept 的 /pt/ 连读要轻', 'weekend 重音在第一音节'],
    background: '「什么都不做」也是好答案，比硬编行程更自然。',
    followUps: ['Do you prefer busy or quiet weekends?', 'What did you do on Sunday?'],
  },
  你最拿手的一道菜: {
    title: '你最拿手的一道菜',
    words: ['recipe', 'ingredient', 'stir-fry', 'season', 'boil', 'taste'],
    phrases: ['It only takes about ten minutes.', 'The key is to …', 'I learned it from …'],
    questions: ['What can you cook well?', 'How did you learn to make it?'],
    sample:
      'The one thing I can cook well is tomato and egg noodles. It only takes about ten minutes. The key is to stir-fry the egg first, then take it out before you cook the tomato. I learned it from my mother, and I still make it the same way.',
    tips: ['ingredient 重音在第二个音节', 'recipe 读 /ˈresəpi/，不是「瑞赛普」'],
    background: '讲菜谱时用 first / then / after that，比背单词更像「会说」。',
    followUps: ['Is it easy for a beginner?', 'What food do you miss from home?'],
  },
  通勤路上你做什么: {
    title: '通勤路上你做什么',
    words: ['commute', 'subway', 'traffic', 'podcast', 'on the way', 'rush hour'],
    phrases: ['It takes me about … minutes.', 'I usually listen to …', 'The worst part is …'],
    questions: ['How do you get to work or school?', 'What do you do on the way?'],
    sample:
      'I take the subway, and it takes about forty minutes. On the way I usually listen to a podcast or review vocabulary. The worst part is rush hour — sometimes I have to wait for two or three trains.',
    tips: ['commute 重音在第二个音节', 'usually 读 /ˈjuːʒuəli/，别读成「优苏里」'],
    background: '通勤是雅思 part 1 高频题，说清楚「多久 + 干什么 + 最烦哪一段」就够。',
    followUps: ['Would you rather drive?', 'What do you do when the train is late?'],
  },
  '手机里最常用的三个 App': {
    title: '手机里最常用的三个 App',
    words: ['app', 'notification', 'screen time', 'useful', 'annoying', 'delete'],
    phrases: ['I use it mostly for …', 'I should probably spend less time on …', "It's useful but distracting."],
    questions: ['Which apps do you use the most?', 'Is there one you would like to use less?'],
    sample:
      'The three apps I use most are a chat app, a map app and a video app. I use the map app mostly for commuting, and the video app when I am too tired to read. Honestly, I should spend less time on the video app. It is useful but distracting.',
    tips: ['apps 的复数 /s/ 要出来', 'distracting 重音在第二个音节'],
    background: '这类题好答，因为例子是你自己的日常，词汇不够也能说清楚。',
    followUps: ['Which one could you live without?', 'Do you turn off notifications?'],
  },
  你最近在学什么: {
    title: '你最近在学什么',
    words: ['practise', 'struggle with', 'get the hang of', 'progress', 'step by step', 'routine'],
    phrases: [
      "I've been learning it for about two months.",
      'The hardest part is …',
      'I try to practise a little every day.',
    ],
    questions: ['What are you learning these days?', 'What is the hardest part of it?'],
    sample:
      "I've been learning English speaking for about two months. The hardest part is not grammar — it is speaking without planning first. I try to practise ten minutes every day, and I record myself once a week to hear the difference.",
    tips: ['practise 重音在第一个音节', 'months 结尾的 /θs/ 别省略'],
    background: '「在学什么」几乎必被追问「难在哪」，先想好一句「难在哪」。',
    followUps: ['How do you practise?', 'What would you like to learn next?'],
  },
  工作或学习里最烦的事: {
    title: '工作或学习里最烦的事',
    words: ['deadline', 'handle', 'figure out', 'delay', 'pressure', 'give up'],
    phrases: ['The most annoying thing is …', "I haven't figured out how to …", 'I try not to give up.'],
    questions: ['What is the most annoying part of your week?', 'How do you usually deal with it?'],
    sample:
      'The most annoying thing for me is waiting for other people to finish their part. I cannot start until they do, so everything gets pushed back. I have not figured out a good way to handle it yet. Usually I just make a list and do what I can.',
    tips: ['figured 的 /g/ 不要吞掉', 'pressure 读 /ˈpreʃə/'],
    background: '抱怨类话题最容易说成抱怨，加一句「我怎么处理」会显得成熟。',
    followUps: ['Does it affect your sleep?', 'What would you change about it?'],
  },
  一张你舍不得删的照片: {
    title: '一张你舍不得删的照片',
    words: ['photo', 'memory', 'blurry', 'take a picture', 'look back', 'moment'],
    phrases: [
      "It's not even a good photo — it's blurry.",
      'Whenever I look at it, I remember …',
      'I keep it because …',
    ],
    questions: ['What is one photo you would never delete?', 'Why does it matter to you?'],
    sample:
      "It's a photo of my grandparents' kitchen, and it is honestly blurry. I took it by accident one summer. Whenever I look at it, I remember the noise and the smell of that kitchen. I keep it because nobody cooks there anymore.",
    tips: ['photo 的 /f/ 用上牙轻碰下唇', 'blurry 重音在第一音节'],
    background: '讲照片=讲一个小故事，用「时间 + 谁 + 为什么留着」三段就够。',
    followUps: ['Do you print photos?', 'Do you take many photos?'],
  },
  如果明天放假一天: {
    title: '如果明天放假一天',
    words: ['day off', 'plan', 'spontaneous', 'somewhere', 'relax', 'waste'],
    phrases: ['If I had a day off tomorrow, I would …', "I'd probably end up …", 'I would not plan anything.'],
    questions: ['What would you do with a free day?', 'Would you plan it or just go?'],
    sample:
      'If I had a day off tomorrow, I would not plan anything. I would probably sleep in, then take a train somewhere near the city and walk around. I would end up in a small restaurant and waste the whole afternoon there.',
    tips: ['would 的 /d/ 轻轻带出即可', "I'd 读成一个音节"],
    background: '虚拟语气（would）用错也不影响交流，敢用就比不用强。',
    followUps: ['Would you go alone or with someone?', 'What would you avoid doing?'],
  },
}

/** 轻松闲聊：固定话题库 */
export const CHILL_TOPICS = ['最近一次旅行', '你最近在追的剧', '你最拿手的一道菜', '通勤路上你做什么', '如果明天放假一天']

/** 挑战进阶：按标签推荐（标签不在表里就用兜底） */
const BY_TAG: Record<string, string[]> = {
  电影迷: ['你最近在追的剧', '一张你舍不得删的照片'],
  科技控: ['手机里最常用的三个 App', '你最近在学什么'],
  旅行党: ['最近一次旅行', '如果明天放假一天'],
  社会派: ['工作或学习里最烦的事', '通勤路上你做什么'],
  摄影: ['一张你舍不得删的照片', '最近一次旅行'],
  健身: ['你最拿手的一道菜', '通勤路上你做什么'],
  宠物: ['一张你舍不得删的照片', '一个让你开心的周末'],
  动漫: ['你最近在追的剧', '一张你舍不得删的照片'],
  咖啡: ['你最拿手的一道菜', '通勤路上你做什么'],
  露营: ['最近一次旅行', '如果明天放假一天'],
  音乐虫: ['你最近在追的剧', '一张你舍不得删的照片'],
  美食家: ['你最拿手的一道菜', '最近一次旅行'],
  游戏党: ['你最近在追的剧', '手机里最常用的三个 App'],
  读书人: ['你最近在学什么', '一张你舍不得删的照片'],
}

const FALLBACK_STRETCH = ['工作或学习里最烦的事', '你最近在学什么']

export function recommendTopics(tags: string[]): string[] {
  const out: string[] = []
  for (const tag of tags) {
    for (const topic of BY_TAG[tag] ?? []) {
      if (!out.includes(topic)) out.push(topic)
    }
  }
  for (const topic of FALLBACK_STRETCH) {
    if (!out.includes(topic)) out.push(topic)
  }
  return out.slice(0, 4)
}

export function cardOf(topic: string): TopicCard | null {
  return TOPIC_CARDS[topic] ?? null
}
