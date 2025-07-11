/**
 * Text comparison and alignment algorithms
 */
import { CONFIG } from '../config.js';
import { GermanChars } from './german-chars.js';

export class TextComparison {
    /**
     * Compare user input with reference text
     */
    static compareTexts(reference, userText, options = {}) {
        // Optionally force case-insensitive alignment (for live feedback only)
        const { ignoreCase = true, forceCaseInsensitiveAlignment = false } = options;
        // Convert German characters in user text
        const convertedUserText = GermanChars.convert(userText);
        const ignorePunctuation = true;

        // For alignment, use case-insensitive only if forced (for live feedback), otherwise use ignoreCase
        let refNormAlign = reference.replace(/[.,!?;:\""''()„""''‚'«»\u0022\u0027\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2039\u203A\u00AB\u00BB\u275B\u275C\u275D\u275E\u300C\u300D\u300E\u300F]/g, '');
        let userNormAlign = convertedUserText.replace(/[.,!?;:\""''()„""''‚'«»\u0022\u0027\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2039\u203A\u00AB\u00BB\u275B\u275C\u275D\u275E\u300C\u300D\u300E\u300F]/g, '');
        if (forceCaseInsensitiveAlignment || ignoreCase) {
            refNormAlign = refNormAlign.toLowerCase();
            userNormAlign = userNormAlign.toLowerCase();
        }
        refNormAlign = refNormAlign.replace(/\s+/g, ' ').trim();
        userNormAlign = userNormAlign.replace(/\s+/g, ' ').trim();
        const refWordsAlign = refNormAlign.split(/\s+/).filter(w => w.length > 0);
        const userWordsAlign = userNormAlign.split(/\s+/).filter(w => w.length > 0);

        // For display, use original case and compare char-by-char for capitalization errors
        let refDisplay = reference.replace(/[.,!?;:\""''()„""''‚'«»\u0022\u0027\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2039\u203A\u00AB\u00BB\u275B\u275C\u275D\u275E\u300C\u300D\u300E\u300F]/g, '').replace(/\s+/g, ' ').trim();
        let userDisplay = convertedUserText.replace(/[.,!?;:\""''()„""''‚'«»\u0022\u0027\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2039\u203A\u00AB\u00BB\u275B\u275C\u275D\u275E\u300C\u300D\u300E\u300F]/g, '').replace(/\s+/g, ' ').trim();
        const refWordsDisplay = refDisplay.split(/\s+/).filter(w => w.length > 0);
        const userWordsDisplay = userDisplay.split(/\s+/).filter(w => w.length > 0);

        // Align using case-insensitive, punctuation-stripped words
        const alignment = this.alignSequencesWithGaps(refWordsAlign, userWordsAlign);

        // Now, for each alignment item, use the display words (with/without case) for output
        const result = [];
        let correct = 0;
        let wrongPosition = 0;
        let wrong = 0;
        let extra = 0;
        let missing = 0;
        for (let i = 0; i < alignment.length; i++) {
            const item = alignment[i];
            if (i > 0) {
                result.push({ char: ' ', status: 'word-boundary' });
            }
            if (item.type === 'match') {
                // Use display words for output
                const userWord = userWordsDisplay[item.userWord ? userWordsAlign.indexOf(item.userWord) : -1] || item.userWord;
                const refWord = refWordsDisplay[item.refWord ? refWordsAlign.indexOf(item.refWord) : -1] || item.refWord;
                for (let c = 0; c < userWord.length; c++) {
                    if (ignoreCase) {
                        // Case-insensitive: only mark as correct if chars match ignoring case
                        if (userWord[c].toLowerCase() === refWord[c]?.toLowerCase()) {
                            result.push({ char: userWord[c], status: 'correct' });
                            correct++;
                        } else {
                            result.push({ char: userWord[c], status: 'wrong' });
                            wrong++;
                        }
                    } else {
                        // Case-sensitive: mark as wrong if case differs
                        if (userWord[c] === refWord[c]) {
                            result.push({ char: userWord[c], status: 'correct' });
                            correct++;
                        } else if (userWord[c]?.toLowerCase() === refWord[c]?.toLowerCase()) {
                            result.push({ char: userWord[c], status: 'wrong-capitalization' });
                            wrong++;
                        } else {
                            result.push({ char: userWord[c], status: 'wrong' });
                            wrong++;
                        }
                    }
                }
            } else if (item.type === 'substitute') {
                // Use display words for output
                const refIdx = refWordsAlign.indexOf(item.refWord);
                const userIdx = userWordsAlign.indexOf(item.userWord);
                const ref = refWordsDisplay[refIdx] || item.refWord;
                const user = userWordsDisplay[userIdx] || item.userWord;
                let missingPrefix = 0;
                let missingSuffix = 0;
                for (let idx = 1; idx <= ref.length; idx++) {
                    if (ref.slice(-idx) === user) {
                        missingPrefix = ref.length - idx;
                        break;
                    }
                }
                if (missingPrefix === 0) {
                    for (let idx = 1; idx <= ref.length; idx++) {
                        if (ref.slice(0, idx) === user) {
                            missingSuffix = ref.length - idx;
                            break;
                        }
                    }
                }
                if (missingPrefix > 0) {
                    for (let k = 0; k < missingPrefix; k++) {
                        if (k > 0) result.push({ char: ' ', status: 'char-space' });
                        result.push({ char: '_', status: 'missing' });
                        missing++;
                    }
                }
                for (let c = 0; c < user.length; c++) {
                    if (ignoreCase) {
                        if (user[c].toLowerCase() === ref[c]?.toLowerCase()) {
                            result.push({ char: user[c], status: 'wrong' });
                            wrong++;
                        } else {
                            result.push({ char: user[c], status: 'wrong' });
                            wrong++;
                        }
                    } else {
                        if (user[c] === ref[c]) {
                            result.push({ char: user[c], status: 'wrong' });
                            wrong++;
                        } else if (user[c]?.toLowerCase() === ref[c]?.toLowerCase()) {
                            result.push({ char: user[c], status: 'wrong-capitalization' });
                            wrong++;
                        } else {
                            result.push({ char: user[c], status: 'wrong' });
                            wrong++;
                        }
                    }
                }
                if (missingSuffix > 0) {
                    for (let k = 0; k < missingSuffix; k++) {
                        result.push({ char: ' ', status: 'char-space' });
                        result.push({ char: '_', status: 'missing' });
                        missing++;
                    }
                }
            } else if (item.type === 'insert') {
                const userIdx = userWordsAlign.indexOf(item.userWord);
                const user = userWordsDisplay[userIdx] || item.userWord;
                for (let char of user) {
                    result.push({ char, status: 'extra' });
                    extra++;
                }
            } else if (item.type === 'delete') {
                const refIdx = refWordsAlign.indexOf(item.refWord);
                const wordLength = (refWordsDisplay[refIdx] || item.refWord).length;
                for (let k = 0; k < wordLength; k++) {
                    if (k > 0) {
                        result.push({ char: ' ', status: 'char-space' });
                    }
                    result.push({ char: '_', status: 'missing' });
                    missing++;
                }
            }
        }
        return {
            chars: result,
            stats: { correct, wrongPosition, wrong, extra, missing }
        };
    }
    
    /**
     * Compare texts for live feedback (handles punctuation display)
     */
    static compareLiveFeedback(reference, userText, options = {}) {
        const { ignoreCase = true } = options;
        
        const convertedUserText = GermanChars.convert(userText);
        const result = [];
        let userPos = 0;
        
        for (let i = 0; i < reference.length; i++) {
            const refChar = reference[i];
            
            // Show punctuation in gray
            if (GermanChars.isPunctuation(refChar)) {
                result.push({ char: refChar, status: 'punctuation' });
                continue;
            }
            
            // Handle spaces
            if (refChar === ' ') {
                result.push({ char: ' ', status: 'word-boundary' });
                continue;
            }
            
            // Skip punctuation and spaces in user input
            while (userPos < convertedUserText.length && 
                   (GermanChars.isPunctuation(convertedUserText[userPos]) || 
                    /\s/.test(convertedUserText[userPos]))) {
                userPos++;
            }
            
            if (userPos < convertedUserText.length) {
                const userChar = convertedUserText[userPos];
                const refCharNorm = ignoreCase ? refChar.toLowerCase() : refChar;
                const userCharNorm = ignoreCase ? userChar.toLowerCase() : userChar;
                
                if (refCharNorm === userCharNorm) {
                    result.push({ char: refChar, status: 'correct' });
                } else {
                    result.push({ char: userChar, status: 'wrong' });
                }
                userPos++;
            } else {
                result.push({ char: '_', status: 'missing' });
            }
        }
        
        return { chars: result };
    }
    
    /**
     * Sequence alignment with gaps using dynamic programming
     */
    static alignSequencesWithGaps(refWords, userWords) {
        const N = refWords.length;
        const M = userWords.length;
        const dp = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));
        const COST = CONFIG.alignmentCosts;
        
        // Initialize base cases
        for (let i = 0; i <= N; i++) {
            dp[i][0] = i * COST.DEL;
        }
        for (let j = 0; j <= M; j++) {
            dp[0][j] = j * COST.INS;
        }
        
        // Fill DP table
        for (let i = 1; i <= N; i++) {
            for (let j = 1; j <= M; j++) {
                const matchCost = dp[i - 1][j - 1] +
                    (refWords[i - 1] === userWords[j - 1] ? COST.MATCH : COST.SUB);
                const delCost = dp[i - 1][j] + COST.DEL;
                const insCost = dp[i][j - 1] + COST.INS;
                
                dp[i][j] = Math.min(matchCost, delCost, insCost);
            }
        }
        
        // Backtrack to find alignment
        return this.backtrackAlignment(dp, refWords, userWords);
    }
    
    /**
     * Backtrack through DP table to find optimal alignment
     */
    static backtrackAlignment(dp, refWords, userWords) {
        let i = refWords.length;
        let j = userWords.length;
        const alignment = [];
        const COST = CONFIG.alignmentCosts;
        
        while (i > 0 || j > 0) {
            const current = dp[i][j];
            
            // Check for match/substitute
            if (i > 0 && j > 0 &&
                current === dp[i - 1][j - 1] +
                           (refWords[i - 1] === userWords[j - 1] ? COST.MATCH : COST.SUB)) {
                alignment.unshift({
                    type: refWords[i - 1] === userWords[j - 1] ? 'match' : 'substitute',
                    refWord: refWords[i - 1],
                    userWord: userWords[j - 1]
                });
                i--; j--;
                continue;
            }
            
            // Check for deletion
            if (i > 0 && current === dp[i - 1][j] + COST.DEL) {
                alignment.unshift({ 
                    type: 'delete', 
                    refWord: refWords[i - 1], 
                    userWord: null 
                });
                i--;
                continue;
            }
            
            // Must be insertion
            alignment.unshift({ 
                type: 'insert', 
                refWord: null, 
                userWord: userWords[j - 1] 
            });
            j--;
        }
        
        return alignment;
    }
    
    /**
     * Generate character-level comparison result from word alignment
     */
    static generateComparisonResult(alignment) {
        const result = [];
        let correct = 0;
        let wrongPosition = 0;
        let wrong = 0;
        let extra = 0;
        let missing = 0;
        
        for (let i = 0; i < alignment.length; i++) {
            const item = alignment[i];
            
            // Add word boundary space (except for first word)
            if (i > 0) {
                result.push({ char: ' ', status: 'word-boundary' });
            }
            
            if (item.type === 'match') {
                // All characters are correct
                for (let char of item.userWord) {
                    result.push({ char, status: 'correct' });
                    correct++;
                }
            } else if (item.type === 'substitute') {
                this.handleSubstitution(item, result);
                
                // Count characters manually for this substitution
                const ref = item.refWord;
                const user = item.userWord;
                
                // Simple character counting for substitution
                for (let i = 0; i < Math.max(ref.length, user.length); i++) {
                    if (i < user.length) {
                        if (i < ref.length && ref[i] === user[i]) {
                            correct++;
                        } else {
                            wrong++;
                        }
                    } else {
                        missing++;
                    }
                }
            } else if (item.type === 'insert') {
                // Extra word
                for (let char of item.userWord) {
                    result.push({ char, status: 'extra' });
                    extra++;
                }
            } else if (item.type === 'delete') {
                // Missing word - show as underscores
                const wordLength = item.refWord.length;
                
                for (let k = 0; k < wordLength; k++) {
                    if (k > 0) {
                        result.push({ char: ' ', status: 'char-space' });
                    }
                    result.push({ char: '_', status: 'missing' });
                    missing++;
                }
            }
        }
        
        return {
            chars: result,
            stats: { 
                correct, 
                wrongPosition, 
                wrong, 
                extra,
                missing,
                total: this.calculateTotalChars(alignment)
            }
        };
    }
    
    /**
     * Handle character-level substitution within a word
     */
    static handleSubstitution(item, result) {
        const ref = item.refWord;
        const user = item.userWord;
        
        let missingPrefix = 0;
        let missingSuffix = 0;
        
        // Check if user word is a suffix of reference word
        for (let idx = 1; idx <= ref.length; idx++) {
            if (ref.slice(-idx) === user) {
                missingPrefix = ref.length - idx;
                break;
            }
        }
        
        // If no suffix match, check for prefix match
        if (missingPrefix === 0) {
            for (let idx = 1; idx <= ref.length; idx++) {
                if (ref.slice(0, idx) === user) {
                    missingSuffix = ref.length - idx;
                    break;
                }
            }
        }
        
        // Add missing prefix
        if (missingPrefix > 0) {
            for (let k = 0; k < missingPrefix; k++) {
                if (k > 0) result.push({ char: ' ', status: 'char-space' });
                result.push({ char: '_', status: 'missing' });
            }
        }
        
        // Add user characters (marked as wrong)
        for (let c = 0; c < user.length; c++) {
            result.push({ char: user[c], status: 'wrong' });
        }
        
        // Add missing suffix
        if (missingSuffix > 0) {
            for (let k = 0; k < missingSuffix; k++) {
                result.push({ char: ' ', status: 'char-space' });
                result.push({ char: '_', status: 'missing' });
            }
        }
    }
    
    /**
     * Calculate total reference characters (excluding spaces)
     */
    static calculateTotalChars(alignment) {
        let total = 0;
        alignment.forEach(item => {
            if (item.refWord) {
                total += item.refWord.length;
            }
        });
        return total;
    }
    
    /**
     * Calculate word-level statistics
     */
    static calculateWordStats(reference, userInput, options = {}) {
        const {
            ignoreCase = true,
            ignorePunctuation = true
        } = options;
        
        const refNormalized = GermanChars.normalizeForComparison(reference, {
            ignorePunctuation,
            ignoreCase,
            convertGermanChars: false
        });
        
        const userNormalized = GermanChars.normalizeForComparison(userInput, {
            ignorePunctuation,
            ignoreCase,
            convertGermanChars: true
        });
        
        const refWords = GermanChars.splitIntoWords(refNormalized);
        const userWords = GermanChars.splitIntoWords(userNormalized);
        
        const alignment = this.alignSequencesWithGaps(refWords, userWords);
        
        let correctWords = 0;
        let wrongWords = 0;
        const totalWords = refWords.length;
        
        alignment.forEach(item => {
            if (item.type === 'match') {
                correctWords++;
            } else if (item.type === 'substitute' || item.type === 'delete') {
                wrongWords++;
            }
            // Note: 'insert' type doesn't count toward wrong words in original logic
        });
        
        return {
            correctWords,
            wrongWords,
            totalWords
        };
    }
}
