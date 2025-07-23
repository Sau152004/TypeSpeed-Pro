class StatsCalculator {
    calculateStats(userInput, originalText, timeElapsed, errors) {
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
        // Standard: 5 characters = 1 word
        stats.rawWpm = (userInput.length / 5) / (timeElapsed / 60);
        stats.wpm = (stats.correctChars / 5) / (timeElapsed / 60);
        
        // Calculate accuracy
        if (userInput.length > 0) {
            stats.accuracy = (stats.correctChars / userInput.length) * 100;
        }
        
        return stats;
    }
    
    calculateWPM(charactersTyped, timeInSeconds) {
        if (timeInSeconds === 0) return 0;
        return (charactersTyped / 5) / (timeInSeconds / 60);
    }
    
    calculateAccuracy(correct, total) {
        if (total === 0) return 100;
        return (correct / total) * 100;
    }
    
    calculateConsistency(wpmHistory) {
        if (wpmHistory.length < 2) return 100;
        
        const values = wpmHistory.map(h => h.wpm);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Convert to consistency percentage (lower deviation = higher consistency)
        const coefficientOfVariation = standardDeviation / mean;
        return Math.max(0, 100 - (coefficientOfVariation * 100));
    }
    
    getPerformanceRating(wpm, accuracy) {
        if (accuracy < 85) return { rating: 'Poor', color: 'red' };
        if (wpm < 20) return { rating: 'Beginner', color: 'orange' };
        if (wpm < 40) return { rating: 'Average', color: 'yellow' };
        if (wpm < 60) return { rating: 'Good', color: 'blue' };
        if (wpm < 80) return { rating: 'Excellent', color: 'green' };
        return { rating: 'Professional', color: 'purple' };
    }
}