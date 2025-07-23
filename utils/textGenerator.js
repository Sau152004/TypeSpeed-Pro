const commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
    'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
    'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
    'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
    'been', 'has', 'had', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'if',
    'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like',
    'into', 'him', 'has', 'two', 'more', 'very', 'what', 'know', 'just', 'first', 'get', 'over',
    'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being',
    'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'go', 'me', 'back', 'with',
    'well', 'were', 'been', 'have', 'there', 'who', 'oil', 'sit', 'its', 'now', 'find', 'long',
    'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'system', 'keep', 'students', 'since',
    'during', 'learn', 'around', 'usually', 'form', 'meat', 'air', 'day', 'place', 'become', 'number',
    'public', 'read', 'keep', 'part', 'start', 'year', 'every', 'field', 'large', 'once', 'available',
    'down', 'give', 'fish', 'human', 'both', 'local', 'sure', 'something', 'without', 'come', 'me',
    'back', 'better', 'general', 'process', 'she', 'heat', 'thanks', 'specific', 'enough', 'long',
    'lot', 'hand', 'popular', 'small', 'though', 'experience', 'include', 'job', 'believe', 'such',
    'doing', 'necessary', 'upon', 'across', 'member', 'ability', 'non', 'table', 'need', 'open',
    'within', 'along', 'down', 'space', 'effective', 'record', 'hand', 'right', 'international',
    'bring', 'community', 'within', 'student', 'others'
];

const quotes = [
    "The quick brown fox jumps over the lazy dog.",
    "To be or not to be, that is the question.",
    "In the beginning was the Word, and the Word was with God, and the Word was God.",
    "It was the best of times, it was the worst of times.",
    "Call me Ishmael.",
    "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    "All happy families are alike; each unhappy family is unhappy in its own way.",
    "It was a bright cold day in April, and the clocks were striking thirteen.",
    "In a hole in the ground there lived a hobbit.",
    "The past is a foreign country; they do things differently there.",
    "Whether I shall turn out to be the hero of my own life, or whether that station will be held by another, these pages must show.",
    "Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.",
    "The snow began to fall as they talked, and continued through the evening.",
    "In the world of programming, there are only two hard things: cache invalidation and naming things.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Code is like humor. When you have to explain it, it's bad.",
    "Programming is not about typing, it's about thinking.",
    "The computer was born to solve problems that did not exist before.",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    "First, solve the problem. Then, write the code.",
    "Experience is the name everyone gives to their mistakes.",
    "In order to understand recursion, you must first understand recursion.",
    "The most important property of a program is whether it accomplishes the intention of its user.",
    "Simplicity is the ultimate sophistication.",
    "Make it work, make it right, make it fast."
];

const programmingWords = [
    'function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined',
    'class', 'method', 'property', 'parameter', 'argument', 'return', 'loop', 'condition', 'event',
    'callback', 'promise', 'async', 'await', 'import', 'export', 'module', 'package', 'library',
    'framework', 'database', 'query', 'server', 'client', 'request', 'response', 'API', 'JSON',
    'HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB', 'SQL', 'Git', 'GitHub'
];

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateText(durationSeconds) {
    // Estimate words needed based on average typing speed
    const avgWpm = 40;
    const estimatedWords = Math.ceil((avgWpm * durationSeconds) / 60);
    return generateWords(Math.max(estimatedWords, 20));
}

function generateWords(count) {
    const shuffledWords = shuffle(commonWords);
    const words = [];
    
    for (let i = 0; i < count; i++) {
        words.push(shuffledWords[i % shuffledWords.length]);
    }
    
    return words.join(' ');
}

function generateProgrammingText(count) {
    const allWords = [...commonWords, ...programmingWords];
    const shuffledWords = shuffle(allWords);
    const words = [];
    
    for (let i = 0; i < count; i++) {
        words.push(shuffledWords[i % shuffledWords.length]);
    }
    
    return words.join(' ');
}

function generateQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

function generatePunctuationText(count) {
    const punctuationWords = [
        'hello,', 'world!', 'how', 'are', 'you?', 'I', 'am', 'fine.', 'Thank', 'you;',
        'this', 'is', 'a', 'test:', 'with', 'punctuation!', 'Let\'s', 'see', 'how',
        'well', 'you', 'can', 'type', 'these', 'symbols.', 'Don\'t', 'forget',
        'about', 'quotation', '"marks"', 'and', 'parentheses', '(like', 'this).',
        'Numbers', 'are', 'important', 'too:', '123', '456', '789', '0.',
        'What', 'about', 'percentages?', '50%', 'or', 'ratios', '1:2?',
        'Email', 'addresses', 'like', 'test@example.com', 'are', 'common.',
        'So', 'are', 'websites:', 'www.example.com', 'and', 'hashtags', '#test'
    ];
    
    const shuffled = shuffle(punctuationWords);
    const words = [];
    
    for (let i = 0; i < count; i++) {
        words.push(shuffled[i % shuffled.length]);
    }
    
    return words.join(' ');
}

function generateNumberText(count) {
    const numberWords = [];
    const baseWords = ['number', 'count', 'total', 'sum', 'value', 'amount', 'quantity'];
    
    for (let i = 0; i < count; i++) {
        if (i % 3 === 0) {
            numberWords.push(Math.floor(Math.random() * 1000).toString());
        } else if (i % 5 === 0) {
            numberWords.push((Math.random() * 100).toFixed(2));
        } else {
            numberWords.push(baseWords[Math.floor(Math.random() * baseWords.length)]);
        }
    }
    
    return numberWords.join(' ');
}

function generateCustomText(options = {}) {
    const {
        type = 'common',
        length = 50,
        includePunctuation = false,
        includeNumbers = false,
        difficulty = 'medium'
    } = options;
    
    let words = [];
    
    switch (type) {
        case 'programming':
            return generateProgrammingText(length);
        case 'punctuation':
            return generatePunctuationText(length);
        case 'numbers':
            return generateNumberText(length);
        case 'quotes':
            return generateQuote();
        default:
            words = shuffle(commonWords);
    }
    
    // Adjust difficulty
    if (difficulty === 'easy') {
        words = words.filter(word => word.length <= 5);
    } else if (difficulty === 'hard') {
        words = words.concat(programmingWords);
    }
    
    const result = [];
    for (let i = 0; i < length; i++) {
        let word = words[i % words.length];
        
        // Add punctuation randomly
        if (includePunctuation && Math.random() < 0.15) {
            const punctuation = ['.', ',', '!', '?', ';', ':'];
            word += punctuation[Math.floor(Math.random() * punctuation.length)];
        }
        
        // Add numbers randomly
        if (includeNumbers && Math.random() < 0.1) {
            result.push(Math.floor(Math.random() * 100).toString());
        }
        
        result.push(word);
    }
    
    return result.join(' ');
}

function getTextStats(text) {
    const words = text.split(' ');
    const chars = text.length;
    const charsWithoutSpaces = text.replace(/\s/g, '').length;
    
    return {
        wordCount: words.length,
        charCount: chars,
        charCountNoSpaces: charsWithoutSpaces,
        avgWordLength: (charsWithoutSpaces / words.length).toFixed(1),
        estimatedTime: Math.ceil(words.length / 40) // Assuming 40 WPM average
    };
}

module.exports = {
    generateText,
    generateWords,
    generateQuote,
    generateProgrammingText,
    generatePunctuationText,
    generateNumberText,
    generateCustomText,
    getTextStats,
    commonWords,
    quotes,
    programmingWords
};