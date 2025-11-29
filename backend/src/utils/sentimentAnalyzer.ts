// Sentiment analysis utility - Created by Harish S & Team
import { logger } from './logger';

// Interface for sentiment analysis result
export interface SentimentResult {
  score: number; // -1 to 1 scale
  magnitude: number; // 0 to 1 scale
  emotionTags: string[];
  confidence: number; // 0 to 1 scale
}

// Keywords for different emotions and stress indicators
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

// Function to analyze sentiment of text
export function analyzeSentiment(text: string): SentimentResult {
  try {
    // Convert text to lowercase for analysis
    const lowerText = text.toLowerCase();
    
    // Initialize scores
    let positiveScore = 0;
    let negativeScore = 0;
    let emotionTags: string[] = [];
    
    // Count positive keywords
    for (const keyword of emotionKeywords.positive) {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      positiveScore += matches;
    }
    
    // Count negative keywords
    for (const keyword of emotionKeywords.negative) {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      negativeScore += matches;
    }
    
    // Check for specific emotion categories
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (emotion === 'positive' || emotion === 'negative') continue;
      
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          emotionTags.push(emotion);
          break; // Only add emotion once per text
        }
      }
    }
    
    // Calculate total word count
    const wordCount = text.trim().split(/\s+/).length;
    
    // Calculate sentiment score (-1 to 1)
    const totalKeywords = positiveScore + negativeScore;
    let score = 0;
    if (totalKeywords > 0) {
      score = (positiveScore - negativeScore) / totalKeywords;
    }
    
    // Calculate magnitude (0 to 1)
    const magnitude = Math.min(totalKeywords / wordCount, 1);
    
    // Calculate confidence based on keyword density and text length
    const confidence = Math.min(
      (totalKeywords / Math.max(wordCount, 1)) * 10, // Scale by keyword density
      1
    );
    
    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));
    
    // Remove duplicate emotion tags
    emotionTags = [...new Set(emotionTags)];
    
    // Log analysis for debugging
    logger.debug(`Sentiment analysis for text: "${text.substring(0, 100)}..."`);
    logger.debug(`Score: ${score}, Magnitude: ${magnitude}, Confidence: ${confidence}`);
    logger.debug(`Emotion tags: ${emotionTags.join(', ')}`);
    
    return {
      score,
      magnitude,
      emotionTags,
      confidence
    };
    
  } catch (error) {
    // Log error and return neutral sentiment
    logger.error('Error in sentiment analysis:', error);
    return {
      score: 0,
      magnitude: 0,
      emotionTags: [],
      confidence: 0
    };
  }
}

// Function to analyze multiple texts and return aggregate sentiment
export function analyzeBulkSentiment(texts: string[]): SentimentResult {
  try {
    // Analyze each text individually
    const results = texts.map(text => analyzeSentiment(text));
    
    // Calculate aggregate scores
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const avgScore = totalScore / results.length;
    
    const totalMagnitude = results.reduce((sum, result) => sum + result.magnitude, 0);
    const avgMagnitude = totalMagnitude / results.length;
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
    const avgConfidence = totalConfidence / results.length;
    
    // Collect all emotion tags
    const allEmotionTags = results.flatMap(result => result.emotionTags);
    const uniqueEmotionTags = [...new Set(allEmotionTags)];
    
    return {
      score: avgScore,
      magnitude: avgMagnitude,
      emotionTags: uniqueEmotionTags,
      confidence: avgConfidence
    };
    
  } catch (error) {
    logger.error('Error in bulk sentiment analysis:', error);
    return {
      score: 0,
      magnitude: 0,
      emotionTags: [],
      confidence: 0
    };
  }
}

// Function to detect stress indicators in text
export function detectStressIndicators(text: string): {
  stressLevel: number; // 0-5 scale
  indicators: string[];
} {
  try {
    const lowerText = text.toLowerCase();
    let stressLevel = 0;
    const indicators: string[] = [];
    
    // Check for stress keywords
    for (const keyword of emotionKeywords.stress) {
      if (lowerText.includes(keyword)) {
        stressLevel += 1;
        indicators.push(keyword);
      }
    }
    
    // Check for urgency indicators
    for (const keyword of emotionKeywords.urgency) {
      if (lowerText.includes(keyword)) {
        stressLevel += 0.5;
        indicators.push(keyword);
      }
    }
    
    // Check for frustration indicators
    for (const keyword of emotionKeywords.frustration) {
      if (lowerText.includes(keyword)) {
        stressLevel += 0.5;
        indicators.push(keyword);
      }
    }
    
    // Normalize stress level to 0-5 scale
    stressLevel = Math.min(5, stressLevel);
    
    return {
      stressLevel,
      indicators: [...new Set(indicators)] // Remove duplicates
    };
    
  } catch (error) {
    logger.error('Error in stress detection:', error);
    return {
      stressLevel: 0,
      indicators: []
    };
  }
}
