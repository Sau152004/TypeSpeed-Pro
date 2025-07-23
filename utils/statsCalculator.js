class StatsCalculator {
    static calculateWpm(charactersTyped, timeInSeconds) {
        if (timeInSeconds === 0) return 0;
        return (charactersTyped / 5) / (timeInSeconds / 60);
    }
    
    static calculateAccuracy(correctChars, totalChars) {
        if (totalChars === 0) return 100;
        return (correctChars / totalChars) * 100;
    }
    
    static calculateStats(userInput, originalText, timeElapsed, errors) {
        const stats = {
            wpm: 0,
            rawWpm: 0,
            accuracy: 100,
            time: timeElapsed,
            correctChars: 0,
            incorrectChars: 0,
            totalChars: userInput.length,
            errorsCount: errors.length
        };
        
        if (timeElapsed === 0) return stats;
        
        // Calculate correct/incorrect characters
        for (let i = 0; i < userInput.length; i++) {
            if (i < originalText.length && userInput[i] === originalText[i]) {
                stats.correctChars++;
            } else {
                stats.incorrectChars++;
            }
        }
        
        // Calculate WPM (words per minute)
        stats.rawWpm = this.calculateWpm(userInput.length, timeElapsed);
        stats.wpm = this.calculateWpm(stats.correctChars, timeElapsed);
        
        // Calculate accuracy
        stats.accuracy = this.calculateAccuracy(stats.correctChars, userInput.length);
        
        return stats;
    }
    
    static calculateConsistency(wpmHistory) {
        if (wpmHistory.length < 2) return 100;
        
        const values = wpmHistory.map(h => h.wpm);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Convert to consistency percentage (lower deviation = higher consistency)
        const coefficientOfVariation = standardDeviation / mean;
        return Math.max(0, 100 - (coefficientOfVariation * 100));
    }
    
    static getPerformanceRating(wpm, accuracy) {
        if (accuracy < 85) return { rating: 'Poor', color: 'red', description: 'Focus on accuracy first' };
        if (wpm < 20) return { rating: 'Beginner', color: 'orange', description: 'Keep practicing!' };
        if (wpm < 40) return { rating: 'Average', color: 'yellow', description: 'Good progress!' };
        if (wpm < 60) return { rating: 'Good', color: 'blue', description: 'Above average!' };
        if (wpm < 80) return { rating: 'Excellent', color: 'green', description: 'Great typing skills!' };
        return { rating: 'Professional', color: 'purple', description: 'Outstanding performance!' };
    }
    
    static calculateUserProgress(testHistory) {
        if (testHistory.length < 2) {
            return {
                improvement: 0,
                trend: 'insufficient_data',
                bestStreak: 0,
                averageImprovement: 0
            };
        }
        
        const recent = testHistory.slice(-10); // Last 10 tests
        const older = testHistory.slice(-20, -10); // Previous 10 tests
        
        const recentAvg = recent.reduce((sum, test) => sum + test.wpm, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, test) => sum + test.wpm, 0) / older.length : recentAvg;
        
        const improvement = recentAvg - olderAvg;
        const trend = improvement > 2 ? 'improving' : improvement < -2 ? 'declining' : 'stable';
        
        // Calculate best streak (consecutive tests with improving WPM)
        let bestStreak = 0;
        let currentStreak = 0;
        
        for (let i = 1; i < testHistory.length; i++) {
            if (testHistory[i].wpm > testHistory[i - 1].wpm) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return {
            improvement,
            trend,
            bestStreak,
            averageImprovement: improvement / Math.max(recent.length, 1)
        };
    }
    
    static calculateDifficultyScore(text) {
        const words = text.split(' ');
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        
        // Count special characters
        const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
        const specialCharRatio = specialChars / text.length;
        
        // Count uppercase letters
        const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
        const upperCaseRatio = upperCaseCount / text.length;
        
        // Calculate difficulty score (1-10)
        let difficulty = 1;
        
        if (avgWordLength > 5) difficulty += 1;
        if (avgWordLength > 7) difficulty += 1;
        if (specialCharRatio > 0.05) difficulty += 2;
        if (specialCharRatio > 0.1) difficulty += 2;
        if (upperCaseRatio > 0.1) difficulty += 1;
        if (upperCaseRatio > 0.2) difficulty += 1;
        
        return Math.min(difficulty, 10);
    }
    
    static getTypingInsights(userStats, testHistory) {
        const insights = [];
        
        // WPM insights
        if (userStats.avg_wpm < 30) {
            insights.push({
                type: 'suggestion',
                title: 'Speed Focus',
                message: 'Practice typing common words to improve speed',
                priority: 'high'
            });
        }
        
        // Accuracy insights
        if (userStats.avg_accuracy < 90) {
            insights.push({
                type: 'warning',
                title: 'Accuracy Focus',
                message: 'Slow down and focus on accuracy. Speed will follow naturally',
                priority: 'high'
            });
        }
        
        // Consistency insights
        if (testHistory.length >= 5) {
            const recent5 = testHistory.slice(-5);
            const wpmVariance = this.calculateVariance(recent5.map(t => t.wpm));
            
            if (wpmVariance > 100) {
                insights.push({
                    type: 'info',
                    title: 'Consistency',
                    message: 'Your typing speed varies significantly. Try to maintain steady rhythm',
                    priority: 'medium'
                });
            }
        }
        
        // Progress insights
        const progress = this.calculateUserProgress(testHistory);
        if (progress.trend === 'improving') {
            insights.push({
                type: 'success',
                title: 'Great Progress!',
                message: `You've improved by ${progress.improvement.toFixed(1)} WPM recently`,
                priority: 'low'
            });
        }
        
        return insights;
    }
    
    static calculateVariance(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    }
    
    static getRecommendations(userStats, testHistory) {
        const recommendations = [];
        
        if (userStats.avg_wpm < 40) {
            recommendations.push({
                title: 'Practice Common Words',
                description: 'Focus on typing the most frequently used words',
                exercises: ['common-words', 'sight-words'],
                estimatedImprovement: '5-10 WPM'
            });
        }
        
        if (userStats.avg_accuracy < 95) {
            recommendations.push({
                title: 'Accuracy Drills',
                description: 'Slow down and focus on hitting the right keys',
                exercises: ['accuracy-training', 'slow-typing'],
                estimatedImprovement: '5-10% accuracy'
            });
        }
        
        if (testHistory.length >= 10) {
            const errorPatterns = this.analyzeErrorPatterns(testHistory);
            if (errorPatterns.length > 0) {
                recommendations.push({
                    title: 'Fix Common Mistakes',
                    description: `You often confuse: ${errorPatterns.join(', ')}`,
                    exercises: ['problem-keys', 'targeted-practice'],
                    estimatedImprovement: '3-5% accuracy'
                });
            }
        }
        
        return recommendations;
    }
    
    static analyzeErrorPatterns(testHistory) {
        // This would analyze common error patterns from test history
        // For now, return empty array - would need detailed error data
        return [];
    }
    
    static calculateTimeToGoal(currentWpm, targetWpm, testsPerWeek = 5) {
        if (currentWpm >= targetWpm) return 0;
        
        const improvementNeeded = targetWpm - currentWpm;
        const avgImprovementPerTest = 0.5; // Conservative estimate
        const testsNeeded = improvementNeeded / avgImprovementPerTest;
        const weeksNeeded = testsNeeded / testsPerWeek;
        
        return Math.ceil(weeksNeeded);
    }
}

module.exports = StatsCalculator;