/**
 * FINAL TUTORIAL - Clean, working implementation
 * Features: VTT timing, spotlight system, auto-focus, simple checkmarks
 */

class SimpleTutorial {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.currentTargetElement = null;
        this.targetClickHandler = null;
        this.currentSentence = 0;
        this.isPlayingSentence = false;
        this.sentences = [];
        
        // Tutorial steps
        this.steps = [
            {
                title: "Welcome! 👋",
                content: "Let's learn the basics of the German Dictation Tool in just a few steps.",
                target: null
            },
            {
                title: "Play Button",
                content: "Click the <strong>play button</strong> to start the audio. Listen carefully!",
                target: '#playBtn',
                waitForClick: true
            },
            {
                title: "Type What You Hear",
                content: "Now click in the <strong>text box</strong> and type <strong>\"es\"</strong> (what you heard in the audio).",
                target: '#userInput',
                waitForClick: true,
                requireText: "es"
            },
            {
                title: "Navigation",
                content: "Great! Use the <strong>arrow buttons</strong> to move between sentences.",
                target: '#nextBtn',
                waitForClick: true
            },
            {
                title: "Speed Control",
                content: "If the audio is too fast, click the <strong>speed button</strong> to slow it down (100% → 75% → 50%).",
                target: '#speedBtn',
                waitForClick: true
            },
            {
                title: "All Done! ✅",
                content: "Perfect! You now know the basics: Play audio, type what you hear, navigate sentences, and adjust speed. Ready to practice German dictation!",
                target: null
            }
        ];
        
        this.init();
    }
    
    init() {
        // Find elements
        this.overlay = document.getElementById('tutorialOverlay');
        this.panel = document.getElementById('tutorialPanel');
        this.titleEl = document.getElementById('tutorialTitle');
        this.contentEl = document.getElementById('tutorialContent');
        this.successEl = document.getElementById('tutorialSuccess');
        
        // Set up tutorial navigation buttons
        this.setupTutorialButtons();
        
        // Auto-start tutorial immediately
        console.log('Tutorial initialized - starting automatically');
        setTimeout(() => {
            this.start();
        }, 500); // Small delay to ensure page is ready
    }
    
    setupTutorialButtons() {
        const nextBtn = document.getElementById('tutorialNext');
        const prevBtn = document.getElementById('tutorialPrev');
        const skipBtn = document.getElementById('tutorialSkip');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('Next button clicked');
                this.nextStep();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('Prev button clicked');
                this.prevStep();
            });
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                console.log('Skip button clicked');
                this.end();
            });
        }
    }
    
    start() {
        console.log('Starting tutorial');
        this.isActive = true;
        this.currentStep = 0;
        this.setupBasicFunctionality();
        this.showStep();
        this.overlay.classList.add('show');
        this.panel.classList.add('show');
    }
    
    async loadVTTFile(vttPath) {
        try {
            const response = await fetch(vttPath);
            const vttText = await response.text();
            this.parseVTT(vttText);
            console.log(`📄 Loaded ${this.sentences.length} sentences from VTT file`);
        } catch (error) {
            console.warn('Failed to load VTT file, using fallback timing:', error);
            // Fallback to hardcoded timing if VTT fails
            this.sentences = [
                { start: 0, end: 2.273, text: "Sentence 1" },
                { start: 2.273, end: 6.141, text: "Sentence 2" },
                { start: 6.141, end: 8.749, text: "Sentence 3" },
                { start: 8.749, end: 10.855, text: "Sentence 4" }
            ];
        }
    }
    
    parseVTT(vttText) {
        const lines = vttText.split('\n');
        this.sentences = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Look for timestamp lines (format: 00:00:00.000 --> 00:00:02.273)
            if (line.includes('-->')) {
                const [startTime, endTime] = line.split('-->').map(t => t.trim());
                const start = this.parseTimeToSeconds(startTime);
                const end = this.parseTimeToSeconds(endTime);
                
                // Get the text from next line
                const text = lines[i + 1] ? lines[i + 1].trim() : '';
                
                if (text) {
                    this.sentences.push({ start, end, text });
                }
            }
        }
        
        console.log('Parsed VTT sentences:', this.sentences);
    }
    
    parseTimeToSeconds(timeStr) {
        // Parse format: 00:00:02.273
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseFloat(parts[2]);
        
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    setupBasicFunctionality() {
        // Get audio element and set up sample audio
        const audioEl = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const speedBtn = document.getElementById('speedBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        
        // Load actual VTT file for precise sentence timing
        this.currentSentence = 0;
        this.sentences = [];
        this.loadVTTFile('audio/A1L01.vtt');
        
        // Load sample audio for tutorial
        if (audioEl && !audioEl.hasAttribute('data-tutorial-setup')) {
            audioEl.src = 'audio/A1L01.mp3';
            audioEl.load();
            audioEl.setAttribute('data-tutorial-setup', 'true');
        }
        
        // Real functionality setup...
        this.setupAudioControls(audioEl, playBtn, speedBtn, nextBtn, prevBtn);
        this.setupTextInput();
    }
    
    setupAudioControls(audioEl, playBtn, speedBtn, nextBtn, prevBtn) {
        // Play button functionality - SINGLE SENTENCE PLAYBACK
        if (playBtn && !playBtn.hasAttribute('data-tutorial-setup')) {
            playBtn.addEventListener('click', () => {
                if (audioEl.paused) {
                    this.playSentence();
                } else {
                    audioEl.pause();
                    playBtn.classList.remove('playing');
                    console.log('⏸️ Paused audio');
                }
            });
            
            // Stop at sentence end
            audioEl.addEventListener('timeupdate', () => {
                if (this.isPlayingSentence && this.sentences.length > 0) {
                    const current = this.sentences[this.currentSentence];
                    if (audioEl.currentTime >= current.end) {
                        audioEl.pause();
                        playBtn.classList.remove('playing');
                        this.isPlayingSentence = false;
                        console.log('⏹️ Sentence ended');
                    }
                }
            });
            
            playBtn.setAttribute('data-tutorial-setup', 'true');
        }
        
        // Speed button functionality
        if (speedBtn && !speedBtn.hasAttribute('data-tutorial-setup')) {
            let speeds = [1.0, 0.75, 0.5];
            let speedLabels = ['100', '75', '50'];
            let currentSpeed = 0;
            
            speedBtn.addEventListener('click', () => {
                currentSpeed = (currentSpeed + 1) % speeds.length;
                audioEl.playbackRate = speeds[currentSpeed];
                speedBtn.textContent = speedLabels[currentSpeed];
                console.log(`🏃 Speed changed to ${speedLabels[currentSpeed]}%`);
            });
            speedBtn.setAttribute('data-tutorial-setup', 'true');
        }
        
        // Navigation buttons
        if (nextBtn && !nextBtn.hasAttribute('data-tutorial-setup')) {
            nextBtn.addEventListener('click', () => {
                if (this.currentSentence < this.sentences.length - 1) {
                    this.currentSentence++;
                    console.log(`➡️ Next sentence (${this.currentSentence + 1}/${this.sentences.length})`);
                }
            });
            nextBtn.setAttribute('data-tutorial-setup', 'true');
        }
        
        if (prevBtn && !prevBtn.hasAttribute('data-tutorial-setup')) {
            prevBtn.addEventListener('click', () => {
                if (this.currentSentence > 0) {
                    this.currentSentence--;
                    console.log(`⬅️ Previous sentence (${this.currentSentence + 1}/${this.sentences.length})`);
                }
            });
            prevBtn.setAttribute('data-tutorial-setup', 'true');
        }
    }
    
    setupTextInput() {
        const userInput = document.getElementById('userInput');
        if (userInput && !userInput.hasAttribute('data-tutorial-setup')) {
            userInput.addEventListener('focus', () => {
                console.log('📝 User focused on text input');
            });
            
            userInput.addEventListener('input', () => {
                console.log('✍️ User is typing:', userInput.value);
            });
            
            userInput.setAttribute('data-tutorial-setup', 'true');
        }
    }
    
    playSentence() {
        const audioEl = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        
        if (this.sentences.length === 0) {
            console.warn('No sentences loaded yet');
            return;
        }
        
        const current = this.sentences[this.currentSentence];
        audioEl.currentTime = current.start;
        this.isPlayingSentence = true;
        
        audioEl.play().then(() => {
            playBtn.classList.add('playing');
            console.log(`▶️ Playing sentence ${this.currentSentence + 1}: "${current.text}"`);
        }).catch(e => {
            console.log('Audio play failed:', e.message);
            playBtn.classList.add('playing');
            this.isPlayingSentence = true;
        });
    }
    
    showStep() {
        const step = this.steps[this.currentStep];
        console.log('Showing step:', this.currentStep, step);
        
        // Update content
        this.titleEl.innerHTML = step.title;
        this.contentEl.innerHTML = step.content;
        
        // Update button visibility
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 0 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.textContent = this.currentStep >= this.steps.length - 1 ? 'Finish' : 'Next';
        }
        
        // Remove previous highlights and listeners
        this.clearHighlights();
        this.removeTargetListener();
        
        // Add highlight and spotlight to target if exists
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                targetEl.classList.add('tutorial-highlight');
                this.createSpotlight(targetEl);
                
                // Auto-focus text input when highlighted
                if (targetEl.id === 'userInput') {
                    setTimeout(() => {
                        targetEl.focus();
                        console.log('📝 Auto-focused text input');
                    }, 300);
                }
                
                // If this step waits for user interaction
                if (step.waitForClick) {
                    this.setupTargetListener(targetEl);
                }
                
                console.log('Added spotlight to:', step.target);
            } else {
                console.warn('Target not found:', step.target);
                this.removeSpotlight();
            }
        } else {
            this.removeSpotlight();
        }
    }
    
    setupTargetListener(targetEl) {
        this.currentTargetElement = targetEl;
        
        // Special handling for text input
        if (targetEl.id === 'userInput') {
            this.targetClickHandler = (e) => {
                // Show checkmark immediately when focused
                this.showSuccessAt(targetEl);
                
                const step = this.steps[this.currentStep];
                const requiredText = step.requireText;
                
                if (requiredText) {
                    // Wait for specific text to be typed
                    const typingHandler = (e) => {
                        const userText = targetEl.value.toLowerCase().trim();
                        if (userText === requiredText.toLowerCase()) {
                            targetEl.removeEventListener('input', typingHandler);
                            // Show success again when correct text is typed
                            this.showSuccessAt(targetEl);
                            setTimeout(() => {
                                this.nextStep();
                            }, 1000);
                        }
                    };
                    
                    targetEl.addEventListener('input', typingHandler);
                } else {
                    // Original behavior - advance after any typing
                    const advanceTimer = setTimeout(() => {
                        this.nextStep();
                    }, 3000);
                    
                    const typingHandler = (e) => {
                        if (targetEl.value.length > 0) {
                            clearTimeout(advanceTimer);
                            targetEl.removeEventListener('input', typingHandler);
                            setTimeout(() => {
                                this.nextStep();
                            }, 1000);
                        }
                    };
                    
                    targetEl.addEventListener('input', typingHandler);
                }
            };
            
            targetEl.addEventListener('focus', this.targetClickHandler);
        } else {
            // Regular button click handler - show checkmark immediately
            this.targetClickHandler = (e) => {
                this.showSuccessAt(targetEl);
                setTimeout(() => {
                    this.nextStep();
                }, 800);
            };
            
            targetEl.addEventListener('click', this.targetClickHandler);
        }
    }
    
    showSuccessAt(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        
        // Position checkmark more centrally and visibly
        if (targetEl.id === 'userInput') {
            // For text input, place checkmark in the center
            this.successEl.style.left = (rect.left + rect.width / 2 - 20) + 'px';
            this.successEl.style.top = (rect.top + rect.height / 2 - 20) + 'px';
        } else {
            // For buttons, place checkmark to the right but closer
            this.successEl.style.left = (rect.right + 5) + 'px';
            this.successEl.style.top = (rect.top + rect.height / 2 - 20) + 'px';
        }
        
        // Add highlight class to make checkmark stand out
        this.successEl.classList.add('tutorial-highlight');
        this.successEl.classList.add('show');
        
        // Keep checkmark visible longer
        setTimeout(() => {
            this.successEl.classList.remove('show');
            this.successEl.classList.remove('tutorial-highlight');
        }, 1500); // Increased from 600ms to 1500ms
    }
    
    removeTargetListener() {
        if (this.currentTargetElement && this.targetClickHandler) {
            this.currentTargetElement.removeEventListener('click', this.targetClickHandler);
            this.currentTargetElement.removeEventListener('focus', this.targetClickHandler);
            this.currentTargetElement = null;
            this.targetClickHandler = null;
        }
    }
    
    createSpotlight(targetEl) {
        // Simplified spotlight - just highlight the element without complex masking
        const rect = targetEl.getBoundingClientRect();
        console.log('Creating simple highlight for element');
        
        // Just remove overlay background to show element clearly
        this.overlay.style.background = 'rgba(0, 0, 0, 0.4)';
    }
    
    removeSpotlight() {
        // Restore normal overlay
        this.overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    }
    
    nextStep() {
        if (this.currentStep >= this.steps.length - 1) {
            this.end();
            return;
        }
        
        this.currentStep++;
        this.showStep();
    }
    
    prevStep() {
        if (this.currentStep <= 0) {
            return;
        }
        
        this.currentStep--;
        this.showStep();
    }
    
    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }
    
    end() {
        console.log('Tutorial completed!');
        this.isActive = false;
        this.clearHighlights();
        this.removeTargetListener();
        this.removeSpotlight();
        this.overlay.classList.remove('show');
        this.panel.classList.remove('show');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tutorial ready - starting automatically');
    window.tutorial = new SimpleTutorial();
});
