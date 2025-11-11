"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSentiment = analyzeSentiment;
exports.analyzeBulkSentiment = analyzeBulkSentiment;
exports.detectStressIndicators = detectStressIndicators;
const logger_1 = require("./logger");
const emotionKeywords = {
    stress: [
        'stressed', 'pressure', 'overwhelmed', 'burnout', 'exhausted', 'drained',
        'anxious', 'worried', 'frustrated', 'irritated', 'tense', 'urgent',
        'deadline', 'crisis', 'emergency', 'rush', 'hectic', 'chaotic'
    ],
    positive: [
        'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
        'happy', 'excited', 'thrilled', 'delighted', 'pleased', 'satisfied',
        'successful', 'achieved', 'accomplished', 'progress', 'improvement'
    ],
    negative: [
        'terrible', 'awful', 'horrible', 'disappointed', 'frustrated', 'angry',
        'sad', 'depressed', 'upset', 'annoyed', 'disgusted', 'furious',
        'failed', 'mistake', 'error', 'problem', 'issue', 'concern'
    ],
    urgency: [
        'urgent', 'asap', 'immediately', 'now', 'quickly', 'fast', 'rush',
        'deadline', 'due', 'critical', 'important', 'priority', 'emergency'
    ],
    frustration: [
        'frustrated', 'annoyed', 'irritated', 'bothered', 'upset', 'angry',
        'mad', 'furious', 'disgusted', 'fed up', 'sick of', 'tired of'
    ],
    excitement: [
        'excited', 'thrilled', 'pumped', 'energized', 'motivated', 'inspired',
        'enthusiastic', 'passionate', 'eager', 'ready', 'looking forward'
    ],
    concern: [
        'concerned', 'worried', 'anxious', 'nervous', 'uneasy', 'troubled',
        'bothered', 'disturbed', 'alarmed', 'frightened', 'scared'
    ]
};
function analyzeSentiment(text) {
    try {
        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        let emotionTags = [];
        for (const keyword of emotionKeywords.positive) {
            const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            positiveScore += matches;
        }
        for (const keyword of emotionKeywords.negative) {
            const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            negativeScore += matches;
        }
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            if (emotion === 'positive' || emotion === 'negative')
                continue;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    emotionTags.push(emotion);
                    break;
                }
            }
        }
        const wordCount = text.trim().split(/\s+/).length;
        const totalKeywords = positiveScore + negativeScore;
        let score = 0;
        if (totalKeywords > 0) {
            score = (positiveScore - negativeScore) / totalKeywords;
        }
        const magnitude = Math.min(totalKeywords / wordCount, 1);
        const confidence = Math.min((totalKeywords / Math.max(wordCount, 1)) * 10, 1);
        score = Math.max(-1, Math.min(1, score));
        emotionTags = [...new Set(emotionTags)];
        logger_1.logger.debug(`Sentiment analysis for text: "${text.substring(0, 100)}..."`);
        logger_1.logger.debug(`Score: ${score}, Magnitude: ${magnitude}, Confidence: ${confidence}`);
        logger_1.logger.debug(`Emotion tags: ${emotionTags.join(', ')}`);
        return {
            score,
            magnitude,
            emotionTags,
            confidence
        };
    }
    catch (error) {
        logger_1.logger.error('Error in sentiment analysis:', error);
        return {
            score: 0,
            magnitude: 0,
            emotionTags: [],
            confidence: 0
        };
    }
}
function analyzeBulkSentiment(texts) {
    try {
        const results = texts.map(text => analyzeSentiment(text));
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const avgScore = totalScore / results.length;
        const totalMagnitude = results.reduce((sum, result) => sum + result.magnitude, 0);
        const avgMagnitude = totalMagnitude / results.length;
        const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
        const avgConfidence = totalConfidence / results.length;
        const allEmotionTags = results.flatMap(result => result.emotionTags);
        const uniqueEmotionTags = [...new Set(allEmotionTags)];
        return {
            score: avgScore,
            magnitude: avgMagnitude,
            emotionTags: uniqueEmotionTags,
            confidence: avgConfidence
        };
    }
    catch (error) {
        logger_1.logger.error('Error in bulk sentiment analysis:', error);
        return {
            score: 0,
            magnitude: 0,
            emotionTags: [],
            confidence: 0
        };
    }
}
function detectStressIndicators(text) {
    try {
        const lowerText = text.toLowerCase();
        let stressLevel = 0;
        const indicators = [];
        for (const keyword of emotionKeywords.stress) {
            if (lowerText.includes(keyword)) {
                stressLevel += 1;
                indicators.push(keyword);
            }
        }
        for (const keyword of emotionKeywords.urgency) {
            if (lowerText.includes(keyword)) {
                stressLevel += 0.5;
                indicators.push(keyword);
            }
        }
        for (const keyword of emotionKeywords.frustration) {
            if (lowerText.includes(keyword)) {
                stressLevel += 0.5;
                indicators.push(keyword);
            }
        }
        stressLevel = Math.min(5, stressLevel);
        return {
            stressLevel,
            indicators: [...new Set(indicators)]
        };
    }
    catch (error) {
        logger_1.logger.error('Error in stress detection:', error);
        return {
            stressLevel: 0,
            indicators: []
        };
    }
}
//# sourceMappingURL=sentimentAnalyzer.js.map