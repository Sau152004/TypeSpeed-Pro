class TypingEngine {
    constructor() {
        this.currentText = '';
        this.userInput = '';
        this.currentPosition = 0;
        this.startTime = null;
        this.endTime = null;
        this.isActive = false;
        this.errors = [];
        this.wpmHistory = [];
        this.testConfig = {
            mode: 'time',
            duration: 15,
            wordCount: 50
        };
        
        this.statsCalculator = new StatsCalculator();
        this.soundManager = new SoundManager();
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.textDisplay = document.getElementById('text-display');
        this.typingInput = document.getElementById('typing-input');
        this.wpmDisplay = document.getElementById('wpm-display');
        this.accuracyDisplay = document.getElementById('accuracy-display');
        this.timeDisplay = document.getElementById('time-display');
        this.rawWpmDisplay = document.getElementById('raw-wpm-display');
        this.progressBar = document.getElementById('progress-bar');
        this.startButton = document.getElementById('start-test');
        this.stopButton = document.getElementById('stop-test');
        this.resetButton = document.getElementById('reset-test');
    }
    
    bindEvents() {
        this.startButton.addEventListener('click', () => this.startTest());
        this.stopButton.addEventListener('click', () => this.stopTest());
        this.resetButton.addEventListener('click', () => this.resetTest());
        
        this.typingInput.addEventListener('input', (e) => this.handleInput(e));
        this.typingInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.typingInput.addEventListener('focus', () => this.handleFocus());
        this.typingInput.addEventListener('blur', () => this.handleBlur());
        
        // Test configuration
        document.getElementById('test-mode').addEventListener('change', (e) => {
            this.updateTestMode(e.target.value);
        });
        
        document.querySelectorAll('.config-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateTestConfig(e));
        });
    }
    
    async startTest() {
        try {
            if (this.testConfig.mode === 'custom') {
                await this.handleCustomText();
            } else {
                await this.generateText();
            }
            
            this.resetStats();
            this.isActive = true;
            this.startTime = Date.now();
            
            this.typingInput.disabled = false;
            this.typingInput.focus();
            this.typingInput.value = '';
            
            this.startButton.classList.add('hidden');
            this.stopButton.classList.remove('hidden');
            this.textDisplay.classList.add('focused');
            
            this.startTimer();
            this.soundManager.play('start');
            
        } catch (error) {
            console.error('Error starting test:', error);
            this.showError('Failed to start test. Please try again.');
        }
    }
    
    stopTest() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.endTime = Date.now();
        
        this.typingInput.disabled = true;
        this.startButton.classList.remove('hidden');
        this.stopButton.classList.add('hidden');
        this.textDisplay.classList.remove('focused');
        
        clearInterval(this.timerInterval);
        this.soundManager.play('complete');
        
        this.calculateFinalStats();
        this.displayResults();
    }
    
    resetTest() {
        this.isActive = false;
        this.currentPosition = 0;
        this.userInput = '';
        this.errors = [];
        this.wpmHistory = [];
        
        this.typingInput.disabled = true;
        this.typingInput.value = '';
        this.startButton.classList.remove('hidden');
        this.stopButton.classList.add('hidden');
        this.textDisplay.classList.remove('focused');
        
        clearInterval(this.timerInterval);
        this.resetStats();
        this.updateDisplay();
        
        document.getElementById('results-content').classList.add('hidden');
        document.getElementById('no-results').classList.remove('hidden');
    }
    
    async generateText() {
        try {
            let endpoint = '/api/text/';
            let params = new URLSearchParams();
            
            switch (this.testConfig.mode) {
                case 'time':
                    endpoint += 'random';
                    params.append('duration', this.testConfig.duration);
                    break;
                case 'words':
                    endpoint += 'words';
                    params.append('count', this.testConfig.wordCount);
                    break;
                case 'quote':
                    endpoint += 'quote';
                    break;
                default:
                    endpoint += 'random';
            }
            
            const response = await fetch(`${endpoint}?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentText = data.text;
                this.renderText();
            } else {
                throw new Error(data.message || 'Failed to generate text');
            }
        } catch (error) {
            console.error('Error generating text:', error);
            this.currentText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!";
            this.renderText();
        }
    }
    
    renderText() {
        const words = this.currentText.split(' ');
        const wordsPerLine = this.calculateWordsPerLine();
        let html = '';
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordIndex = this.currentText.indexOf(word, i === 0 ? 0 : this.currentText.indexOf(words[i-1]) + words[i-1].length + 1);
            
            html += '<span class="word" data-word-index="' + i + '">';
            
            for (let j = 0; j < word.length; j++) {
                const charIndex = wordIndex + j;
                html += '<span class="typing-char" data-char-index="' + charIndex + '">' + 
                       this.escapeHtml(word[j]) + '</span>';
            }
            
            html += '</span>';
            
            if (i < words.length - 1) {
                const spaceIndex = wordIndex + word.length;
                html += '<span class="typing-char" data-char-index="' + spaceIndex + '"> </span>';
            }
            
            // Add line breaks for better readability
            if ((i + 1) % wordsPerLine === 0 && i < words.length - 1) {
                html += '<br>';
            }
        }
        
        this.textDisplay.innerHTML = html;
        this.updateCursor();
    }
    
    calculateWordsPerLine() {
        const displayWidth = this.textDisplay.offsetWidth;
        const avgCharWidth = 12; // Approximate character width in pixels
        const avgWordLength = 5;
        return Math.floor(displayWidth / (avgWordLength * avgCharWidth + 20)); // +20 for spacing
    }
    
    handleInput(e) {
        if (!this.isActive) return;
        
        this.userInput = e.target.value;
        this.updateTypingDisplay();
        this.updateStats();
        
        // Auto-advance on space or completion
        if (this.testConfig.mode === 'words' && this.userInput.length >= this.currentText.length) {
            setTimeout(() => this.stopTest(), 100);
        }
    }
    
    handleKeyDown(e) {
        if (!this.isActive) return;
        
        // Prevent certain key combinations
        if (e.ctrlKey || e.altKey || e.metaKey) {
            if (!['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        }
        
        // Handle special keys
        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                break;
            case 'Escape':
                this.stopTest();
                break;
        }
        
        this.soundManager.play('keystroke');
    }
    
    updateTypingDisplay() {
        const chars = this.textDisplay.querySelectorAll('.typing-char');
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const expectedChar = this.currentText[i];
            const typedChar = this.userInput[i];
            
            // Reset classes
            char.className = 'typing-char';
            
            if (i < this.userInput.length) {
                if (typedChar === expectedChar) {
                    char.classList.add('typing-char-correct');
                } else {
                    char.classList.add('typing-char-incorrect');
                    this.recordError(i, expectedChar, typedChar);
                }
            } else if (i === this.userInput.length) {
                char.classList.add('typing-char-current');
            } else {
                char.classList.add('typing-char-pending');
            }
        }
        
        this.currentPosition = this.userInput.length;
        this.updateCursor();
    }
    
    updateCursor() {
        // Remove existing cursor
        const existingCursor = this.textDisplay.querySelector('.typing-cursor');
        if (existingCursor) {
            existingCursor.remove();
        }
        
        // Add cursor at current position
        const currentChar = this.textDisplay.querySelector(`[data-char-index="${this.currentPosition}"]`);
        if (currentChar) {
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            currentChar.appendChild(cursor);
        }
    }
    
    recordError(position, expected, typed) {
        const existingError = this.errors.find(e => e.position === position);
        if (!existingError) {
            this.errors.push({
                position,
                expected,
                typed,
                timestamp: Date.now() - this.startTime
            });
            this.soundManager.play('error');
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isActive) return;
            
            const elapsed = (Date.now() - this.startTime) / 1000;
            
            if (this.testConfig.mode === 'time') {
                const remaining = Math.max(0, this.testConfig.duration - elapsed);
                this.timeDisplay.textContent = Math.ceil(remaining) + 's';
                
                if (remaining <= 0) {
                    this.stopTest();
                    return;
                }
            } else {
                this.timeDisplay.textContent = Math.floor(elapsed) + 's';
            }
            
            // Update progress
            this.updateProgress();
            
            // Record WPM for chart
            if (Math.floor(elapsed) > this.wpmHistory.length) {
                const currentWpm = this.statsCalculator.calculateWPM(
                    this.userInput.length,
                    elapsed
                );
                this.wpmHistory.push({
                    time: elapsed,
                    wpm: currentWpm
                });
            }
        }, 100);
    }
    
    updateStats() {
        const elapsed = this.isActive ? (Date.now() - this.startTime) / 1000 : 0;
        const stats = this.statsCalculator.calculateStats(
            this.userInput,
            this.currentText,
            elapsed,
            this.errors
        );
        
        this.wpmDisplay.textContent = Math.round(stats.wpm);
        this.accuracyDisplay.textContent = Math.round(stats.accuracy) + '%';
        this.rawWpmDisplay.textContent = Math.round(stats.rawWpm);
    }
    
    updateProgress() {
        let progress = 0;
        
        if (this.testConfig.mode === 'time') {
            const elapsed = (Date.now() - this.startTime) / 1000;
            progress = Math.min(100, (elapsed / this.testConfig.duration) * 100);
        } else if (this.testConfig.mode === 'words') {
            progress = (this.userInput.length / this.currentText.length) * 100;
        }
        
        this.progressBar.style.width = progress + '%';
    }
    
    calculateFinalStats() {
        const elapsed = (this.endTime - this.startTime) / 1000;
        return this.statsCalculator.calculateStats(
            this.userInput,
            this.currentText,
            elapsed,
            this.errors
        );
    }
    
    displayResults() {
        const stats = this.calculateFinalStats();
        
        // Update result displays
        document.getElementById('final-wpm').textContent = Math.round(stats.wpm);
        document.getElementById('final-accuracy').textContent = Math.round(stats.accuracy) + '%';
        document.getElementById('final-time').textContent = Math.round(stats.time) + 's';
        document.getElementById('final-raw-wpm').textContent = Math.round(stats.rawWpm);
        
        document.getElementById('correct-chars').textContent = stats.correctChars;
        document.getElementById('incorrect-chars').textContent = stats.incorrectChars;
        document.getElementById('total-chars').textContent = stats.totalChars;
        
        // Show results panel
        document.getElementById('no-results').classList.add('hidden');
        document.getElementById('results-content').classList.remove('hidden');
        
        // Draw WPM chart
        this.drawWpmChart();
        
        // Show error analysis
        this.displayErrorAnalysis();
        
        // Check for personal best
        this.checkPersonalBest(stats);
    }
    
    drawWpmChart() {
        const canvas = document.getElementById('wpm-chart');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        if (this.wpmHistory.length < 2) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart styling
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Find min/max values
        const maxWpm = Math.max(...this.wpmHistory.map(h => h.wpm));
        const minWpm = Math.min(...this.wpmHistory.map(h => h.wpm));
        const maxTime = Math.max(...this.wpmHistory.map(h => h.time));
        
        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw WPM line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.wpmHistory.forEach((point, index) => {
            const x = padding + (point.time / maxTime) * chartWidth;
            const y = padding + chartHeight - ((point.wpm - minWpm) / (maxWpm - minWpm)) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#3b82f6';
        this.wpmHistory.forEach(point => {
            const x = padding + (point.time / maxTime) * chartWidth;
            const y = padding + chartHeight - ((point.wpm - minWpm) / (maxWpm - minWpm)) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    displayErrorAnalysis() {
        const errorList = document.getElementById('error-list');
        
        if (this.errors.length === 0) {
            errorList.innerHTML = '<p class="text-green-600 dark:text-green-400">Perfect! No errors detected.</p>';
            return;
        }
        
        // Group errors by character
        const errorGroups = {};
        this.errors.forEach(error => {
            const key = `${error.expected} → ${error.typed}`;
            if (!errorGroups[key]) {
                errorGroups[key] = 0;
            }
            errorGroups[key]++;
        });
        
        // Sort by frequency
        const sortedErrors = Object.entries(errorGroups)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Top 5 errors
        
        errorList.innerHTML = sortedErrors.map(([error, count]) => {
            return `
                <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded">
                    <span class="font-mono">${this.escapeHtml(error)}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${count}x</span>
                </div>
            `;
        }).join('');
    }
    
    async checkPersonalBest(stats) {
        if (!window.user) return;
        
        try {
            const response = await fetch('/api/user/personal-best');
            const data = await response.json();
            
            if (data.success && stats.wpm > (data.personalBest?.wpm || 0)) {
                document.getElementById('personal-best').style.display = 'block';
            }
        } catch (error) {
            console.error('Error checking personal best:', error);
        }
    }
    
    updateTestMode(mode) {
        this.testConfig.mode = mode;
        
        // Show/hide relevant options
        document.getElementById('time-options').classList.toggle('hidden', mode !== 'time');
        document.getElementById('word-options').classList.toggle('hidden', mode !== 'words');
        
        if (mode === 'custom') {
            this.showCustomTextModal();
        }
        
        this.resetTest();
    }
    
    updateTestConfig(e) {
        const value = parseInt(e.target.dataset.value);
        
        // Update active button
        e.target.parentElement.querySelectorAll('.config-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update config
        if (this.testConfig.mode === 'time') {
            this.testConfig.duration = value;
        } else if (this.testConfig.mode === 'words') {
            this.testConfig.wordCount = value;
        }
        
        this.resetTest();
    }
    
    showCustomTextModal() {
        document.getElementById('custom-text-modal').classList.remove('hidden');
        document.getElementById('custom-text-modal').classList.add('flex');
        document.getElementById('custom-text-input').focus();
    }
    
    async handleCustomText() {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-text-modal');
            const input = document.getElementById('custom-text-input');
            const applyBtn = document.getElementById('apply-custom');
            const cancelBtn = document.getElementById('cancel-custom');
            const closeBtn = document.getElementById('close-custom-modal');
            
            const closeModal = () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            };
            
            const applyText = () => {
                const text = input.value.trim();
                if (text.length < 10) {
                    alert('Custom text must be at least 10 characters long.');
                    return;
                }
                this.currentText = text;
                this.renderText();
                closeModal();
                resolve();
            };
            
            applyBtn.onclick = applyText;
            cancelBtn.onclick = () => {
                closeModal();
                resolve();
            };
            closeBtn.onclick = () => {
                closeModal();
                resolve();
            };
            
            input.onkeydown = (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    applyText();
                } else if (e.key === 'Escape') {
                    closeModal();
                    resolve();
                }
            };
        });
    }
    
    resetStats() {
        this.wpmDisplay.textContent = '0';
        this.accuracyDisplay.textContent = '100%';
        this.timeDisplay.textContent = '--';
        this.rawWpmDisplay.textContent = '0';
        this.progressBar.style.width = '0%';
    }
    
    updateDisplay() {
        this.renderText();
    }
    
    handleFocus() {
        this.textDisplay.classList.add('focused');
    }
    
    handleBlur() {
        if (!this.isActive) {
            this.textDisplay.classList.remove('focused');
        }
    }
    
    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.typingEngine = new TypingEngine();
});