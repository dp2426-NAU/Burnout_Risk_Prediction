export interface SentimentResult {
    score: number;
    magnitude: number;
    emotionTags: string[];
    confidence: number;
}
export declare function analyzeSentiment(text: string): SentimentResult;
export declare function analyzeBulkSentiment(texts: string[]): SentimentResult;
export declare function detectStressIndicators(text: string): {
    stressLevel: number;
    indicators: string[];
};
//# sourceMappingURL=sentimentAnalyzer.d.ts.map