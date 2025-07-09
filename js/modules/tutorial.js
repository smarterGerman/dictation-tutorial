/**
 * Interactive Tutorial System
 * Guides users through all features and keyboard shortcuts step by step
 */
import { DOMHelpers } from '../utils/dom-helpers.js';

export class Tutorial {
    constructor(dictationApp) {
        this.app = dictationApp;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tutorialContainer = null;
        this.checkmarkElement = null;
        this.highlightElement = null;
        this.spotlightElement = null;
        this.validatingKeyboardStep = false;

        // Interaction tracking
        this.speedStatesVisited = new Set();

        // Detect if on mobile (simple check)
        this.isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

        // Tutorial steps configuration
       // In js/modules/tutorial.js, find the allSteps array and replace it with this reordered version:

const allSteps = [
    {
        id: 'play-button',
        title: 'Play Button',
        description: 'Click the play button to start audio playback for the current sentence.',
        targetSelector: '#playBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => this.app.audioPlayer && this.app.audioPlayer.isPlaying,
        onComplete: () => {
            // Let the audio play - don't pause it immediately
            // The user will learn to pause it in the next step
        }
    },
    {
        id: 'pause-button',
        title: 'Pause Button',
        description: 'Click the play button once while audio is playing to pause it. Notice the green dot indicating paused state.',
        targetSelector: '#playBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => this.app.audioPlayer && !this.app.audioPlayer.isPlaying
    },
    // Keyboard shortcut steps are hidden on mobile
    {
        id: 'keyboard-play',
        title: 'Keyboard Shortcut: Play/Pause',
        description: 'Press Shift + Cmd/Ctrl + Enter to play/pause audio. The green dot indicates that your audio is paused.',
        targetSelector: '#playBtn',
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'Enter'], // Will handle cross-platform
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-play):');
            console.log('    app.audioPlayer exists:', !!this.app.audioPlayer);
            if (this.app.audioPlayer) {
                console.log('    isPlaying:', this.app.audioPlayer.isPlaying);
            }
            const result = this.app.audioPlayer && this.app.audioPlayer.isPlaying;
            console.log('    Final validation result:', result);
            return result;
        },
        onStart: () => {
            // Ensure text input is NOT focused when this step starts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
            }
            // Ensure audio is paused first so user can practice continuing with keyboard shortcut
            if (this.app.audioPlayer && this.app.audioPlayer.isPlaying) {
                this.app.audioPlayer.pause();
            }
        }
    },
    {
        id: 'typing-practice-1',
        title: 'Repeat Sentence',
        description: 'Double-click the play button quickly to repeat the current sentence from the beginning.',
        targetSelector: '#playBtn',
        highlightType: 'pulse',
        action: 'doubleclick',
        validation: () => {
            // Check if audio is playing (indicating sentence was repeated)
            return this.app.audioPlayer && this.app.audioPlayer.isPlaying;
        },
        onStart: () => {
            this.doubleClickTracker = { clicks: 0, lastClickTime: 0 };
            // Ensure audio is paused so user can practice double-clicking to repeat
            if (this.app.audioPlayer && this.app.audioPlayer.isPlaying) {
                this.app.audioPlayer.pause();
            }
        }
    },
    {
        id: 'keyboard-play-current',
        title: 'Keyboard Shortcut: Repeat Sentence',
        description: 'Press Shift + Cmd/Ctrl + ↑ (up arrow) to repeat the current sentence from the beginning.',
        targetSelector: '#speedBtn', // Use speed button as visual reference
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'ArrowUp'],
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-play-current):');
            console.log('    app.audioPlayer exists:', !!this.app.audioPlayer);
            if (this.app.audioPlayer) {
                console.log('    isPlaying:', this.app.audioPlayer.isPlaying);
                console.log('    currentTime:', this.app.audioPlayer.audio ? this.app.audioPlayer.audio.currentTime : 'unknown');
            }
            
            // Check if audio is playing (indicating sentence was repeated)
            const result = this.app.audioPlayer && this.app.audioPlayer.isPlaying;
            console.log('    Final validation result:', result);
            return result;
        },
        onStart: () => {
            // Ensure text input is NOT focused during keyboard shortcuts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
                userInput.value = ''; // Clear any existing content
            }
            // Ensure audio is paused so user can practice playing with keyboard shortcut
            if (this.app.audioPlayer && this.app.audioPlayer.isPlaying) {
                this.app.audioPlayer.pause();
            }
        }
    },
    {
        id: 'next-sentence',
        title: 'Next Sentence',
        description: 'Click the right arrow to move to the next sentence. Observe the progress bar.',
        targetSelector: '#nextBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => this.app.audioPlayer && this.app.audioPlayer.currentCueIndex > 0,
        onInteraction: () => {
            // Play the new sentence after navigation
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 100);
        }
    },
    {
        id: 'keyboard-next',
        title: 'Keyboard Shortcut: Next Sentence',
        description: 'Press Shift + Cmd/Ctrl + → (right arrow) to go to next sentence.',
        targetSelector: '#nextBtn',
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'ArrowRight'],
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-next):');
            console.log('    currentStepStartIndex:', this.currentStepStartIndex);
            console.log('    app.audioPlayer exists:', !!this.app.audioPlayer);
            if (this.app.audioPlayer) {
                console.log('    current currentCueIndex:', this.app.audioPlayer.currentCueIndex);
                console.log('    total cues:', this.app.audioPlayer.vttCues ? this.app.audioPlayer.vttCues.length : 'unknown');
                console.log('    comparison:', this.app.audioPlayer.currentCueIndex, '>', this.currentStepStartIndex);
                console.log('    result:', this.app.audioPlayer.currentCueIndex > this.currentStepStartIndex);
            }
            
            if (this.currentStepStartIndex === undefined) {
                console.log('    ❌ currentStepStartIndex is undefined');
                return false;
            }
            if (!this.app.audioPlayer) {
                console.log('    ❌ audioPlayer not available');
                return false;
            }
            const currentIndex = this.app.audioPlayer.currentCueIndex;
            const totalCues = this.app.audioPlayer.vttCues ? this.app.audioPlayer.vttCues.length : 0;
            
            // If we moved forward, great!
            if (currentIndex > this.currentStepStartIndex) {
                console.log('    ✅ Moved forward successfully');
                return true;
            }
            
            // If we're at the last cue and started at the last cue, accept it
            if (this.currentStepStartIndex >= totalCues - 1 && currentIndex >= totalCues - 1) {
                console.log('    ✅ Already at last cue, shortcut executed correctly');
                return true;
            }
            
            console.log('    ❌ No forward movement detected');
            console.log('    Debug: startIndex=', this.currentStepStartIndex, 'currentIndex=', currentIndex, 'totalCues=', totalCues);
            return false;
        },
        onStart: () => {
            // Store the starting index when this step begins
            if (this.app.audioPlayer) {
                this.currentStepStartIndex = this.app.audioPlayer.currentCueIndex;
            }
            // Ensure text input is NOT focused during keyboard shortcuts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
                userInput.value = ''; // Clear any existing content
            }
        },
        onComplete: () => {
            // Play the new sentence after successful navigation
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 200);
        }
    },
    {
        id: 'prev-sentence',
        title: 'Previous Sentence',
        description: 'Click the left arrow to go back to the previous sentence. Observe the progress bar.',
        targetSelector: '#prevBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            if (this.prevStepStartIndex === undefined) {
                return false;
            }
            if (!this.app.audioPlayer) {
                return false;
            }
            const currentIndex = this.app.audioPlayer.currentCueIndex;
            
            // If we moved backward, great!
            if (currentIndex < this.prevStepStartIndex) {
                return true;
            }
            
            // If we're at index 0 and tried to go previous, accept it
            if (this.prevStepStartIndex === 0 && currentIndex === 0) {
                return true;
            }
            
            return false;
        },
        onStart: () => {
            // Store the starting index when this step begins
            if (this.app.audioPlayer) {
                this.prevStepStartIndex = this.app.audioPlayer.currentCueIndex;
            }
        },
        onInteraction: () => {
            // Play the new sentence after navigation
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 100);
        }
    },
    {
        id: 'keyboard-prev',
        title: 'Keyboard Shortcut: Previous Sentence',
        description: 'Press Shift + Cmd/Ctrl + ← (left arrow) to go to previous sentence.',
        targetSelector: '#prevBtn',
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'ArrowLeft'],
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-prev):');
            console.log('    prevStepStartIndex:', this.prevStepStartIndex);
            console.log('    app.audioPlayer exists:', !!this.app.audioPlayer);
            if (this.app.audioPlayer) {
                console.log('    current currentCueIndex:', this.app.audioPlayer.currentCueIndex);
                console.log('    comparison:', this.app.audioPlayer.currentCueIndex, '<', this.prevStepStartIndex);
                console.log('    result:', this.app.audioPlayer.currentCueIndex < this.prevStepStartIndex);
            }
            
            if (this.prevStepStartIndex === undefined) {
                console.log('    ❌ prevStepStartIndex is undefined');
                return false;
            }
            if (!this.app.audioPlayer) {
                console.log('    ❌ audioPlayer not available');
                return false;
            }
            const currentIndex = this.app.audioPlayer.currentCueIndex;
            
            // If we moved backward, great!
            if (currentIndex < this.prevStepStartIndex) {
                console.log('    ✅ Moved backward successfully');
                return true;
            }
            
            // If we're at index 0 and started at index 0, accept it
            if (this.prevStepStartIndex === 0 && currentIndex === 0) {
                console.log('    ✅ Already at first cue, shortcut executed correctly');
                return true;
            }
            
            console.log('    ❌ No backward movement detected');
            console.log('    Debug: startIndex=', this.prevStepStartIndex, 'currentIndex=', currentIndex);
            return false;
        },
        onStart: () => {
            // Store the starting index when this step begins
            if (this.app.audioPlayer) {
                this.prevStepStartIndex = this.app.audioPlayer.currentCueIndex;
            }
            // Ensure text input is NOT focused during keyboard shortcuts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
                userInput.value = ''; // Clear any existing content
            }
        },
        onComplete: () => {
            // Play the new sentence after successful navigation
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 200);
        }
    },
    {
        id: 'speed-control',
        title: 'Speed Control',
        description: 'Click the speed button 3x to cycle through all speeds (100%, 75%, 50%).',
        targetSelector: '#speedBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            // Check if user has cycled through all three speeds
            if (!this.speedStatesVisited) {
                this.speedStatesVisited = new Set();
            }
            
            // Track the current speed state
            if (this.app.audioPlayer) {
                this.speedStatesVisited.add(this.app.audioPlayer.currentSpeed);
            }
            
            // Validation passes when user has seen all three states: 1.0, 0.75, 0.5
            return this.speedStatesVisited.has(1.0) && 
                   this.speedStatesVisited.has(0.75) && 
                   this.speedStatesVisited.has(0.5);
        },
        onInteraction: () => {
            // Initialize tracking if needed
            if (!this.speedStatesVisited) {
                this.speedStatesVisited = new Set();
            }
            // Track current speed and play sentence to demonstrate the speed change
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.speedStatesVisited.add(this.app.audioPlayer.currentSpeed);
                    // Play the current sentence to demonstrate the speed change
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 50);
        }
    },
    {
        id: 'keyboard-speed',
        title: 'Keyboard Shortcut: Speed Control',
        description: 'Press Shift + Cmd/Ctrl + ↓ (down arrow) to cycle through playback speeds.',
        targetSelector: '#speedBtn',
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'ArrowDown'],
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-speed):');
            
            if (!this.speedStatesVisited) {
                this.speedStatesVisited = new Set();
            }
            
            // Track the current speed state
            if (this.app.audioPlayer) {
                this.speedStatesVisited.add(this.app.audioPlayer.currentSpeed);
                console.log('    current speed:', this.app.audioPlayer.currentSpeed);
                console.log('    visited speeds:', Array.from(this.speedStatesVisited));
            }
            
            // For this step, we just need to see that the user pressed the shortcut and changed the speed
            // We'll check if the speed changed from what it was when the step started
            const currentSpeed = this.app.audioPlayer ? this.app.audioPlayer.currentSpeed : 1.0;
            const speedChanged = this.keyboardSpeedStepStartSpeed !== undefined && 
                               currentSpeed !== this.keyboardSpeedStepStartSpeed;
            
            console.log('    start speed:', this.keyboardSpeedStepStartSpeed, 'current speed:', currentSpeed);
            console.log('    speed changed:', speedChanged);
            
            return speedChanged;
        },
        onStart: () => {
            // Store the starting speed for this step
            this.keyboardSpeedStepStartSpeed = this.app.audioPlayer ? this.app.audioPlayer.currentSpeed : 1.0;
            
            // Ensure text input is NOT focused during keyboard shortcuts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
                userInput.value = ''; // Clear any existing content
            }
        },
        onComplete: () => {
            // Play sentence to demonstrate the new speed
            setTimeout(() => {
                if (this.app.audioPlayer) {
                    this.app.audioPlayer.playCurrentSentence();
                }
            }, 200);
        }
    },
    {
        id: 'hint-button',
        title: 'Hint System',
        description: 'Click the "?" button to see the expected text for the current sentence.',
        targetSelector: '#hintBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            const hintDisplay = document.getElementById('hintDisplay');
            return hintDisplay && hintDisplay.style.display !== 'none';
        },
        onComplete: () => {
            // Add a delay so users can notice the hint before tutorial advances
            return new Promise(resolve => {
                setTimeout(resolve, 1500); // 1.5 second delay to notice the hint
            });
        }
    },
    {
        id: 'keyboard-hint',
        title: 'Keyboard Shortcut: Hint System',
        description: 'Press Shift + Cmd/Ctrl + ß (or / or ,) to show/hide the hint for the current sentence.',
        targetSelector: '#hintBtn',
        highlightType: 'pulse',
        action: 'keyboard',
        keyCombo: ['Shift', 'Meta', 'ß'],
        mobileHidden: true,
        validation: () => {
            console.log('  🔍 VALIDATION DEBUG (keyboard-hint):');
            
            const hintDisplay = document.getElementById('hintDisplay');
            console.log('    hintDisplay element exists:', !!hintDisplay);
            if (hintDisplay) {
                console.log('    hintDisplay style.display:', hintDisplay.style.display);
                console.log('    hintDisplay computed display:', window.getComputedStyle(hintDisplay).display);
            }
            
            // For keyboard hint validation, we want to check if the hint display state changed
            // We'll track if the hint was toggled from its initial state
            const isVisible = hintDisplay && hintDisplay.style.display !== 'none';
            const stateChanged = this.keyboardHintStepStartState !== undefined && 
                               isVisible !== this.keyboardHintStepStartState;
            
            console.log('    start state:', this.keyboardHintStepStartState, 'current visible:', isVisible);
            console.log('    state changed:', stateChanged);
            
            return stateChanged;
        },
        onStart: () => {
            // Store the starting hint display state
            const hintDisplay = document.getElementById('hintDisplay');
            this.keyboardHintStepStartState = hintDisplay && hintDisplay.style.display !== 'none';
            
            // Ensure text input is NOT focused during keyboard shortcuts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.blur();
                userInput.value = ''; // Clear any existing content
            }
        },
        onComplete: () => {
            // Add a delay so users can notice the hint toggle before tutorial advances
            return new Promise(resolve => {
                setTimeout(resolve, 1500); // 1.5 second delay to notice the hint
            });
        }
    },
    {
        id: 'typing-practice-2',
        title: 'Typing Practice 2',
        description: 'Type "es ist" in lowercase in the text input area to demonstrate case sensitivity.',
        targetSelector: '#userInput',
        highlightType: 'pulse',
        action: 'typing',
        validation: () => {
            const userInput = document.getElementById('userInput');
            if (!userInput) return false;
            const value = userInput.value.toLowerCase();
            return value.includes('es ist');
        },
        onStart: () => {
            // Focus the text input when this step starts
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.focus();
            }
        }
        // Note: No onComplete callback - we want to keep the text visible for the Aa demo
    },
    {
        id: 'case-sensitivity',
        title: 'Case Sensitivity Toggle',
        description: 'Click the "Aa" button to toggle case sensitivity on/off. Notice how this affects the text you just typed.',
        targetSelector: '#ignoreCaseBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            const btn = document.getElementById('ignoreCaseBtn');
            return btn && btn.classList.contains('active');
        },
        onComplete: () => {
            // Add a delay so users can process the case sensitivity change
            return new Promise(resolve => {
                setTimeout(resolve, 2000); // 2 second delay to notice the effect
            });
        }
    },
    {
        id: 'focus-mode',
        title: 'Focus Mode',
        description: 'Click the focus button to hide live feedback for concentrated practice.',
        targetSelector: '#focusModeBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            const btn = document.getElementById('focusModeBtn');
            return btn && btn.classList.contains('active');
        },
        onComplete: () => {
            // Add a delay so users can see the focus mode effect
            return new Promise(resolve => {
                setTimeout(resolve, 3000); // 3 second delay to notice the focus mode
            });
        }
    },
    {
        id: 'close-button',
        title: 'End Dictation',
        description: 'Click the "X" button to end the dictation session and see your results.',
        targetSelector: '#endDictationBtn',
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            // This step will be completed when the user clicks the end dictation button
            // We'll handle this specially in the click handler
            return false; // Never auto-complete, only through manual click
        },
        onStart: () => {
            // Mark this as the end dictation step for special handling
            this.isEndDictationStep = true;
        },
        onComplete: () => {
            // Don't actually end the dictation yet, advance to the next step instead
            this.isEndDictationStep = false;
        }
    },
    {
        id: 'export-options',
        title: 'Export & Restart Options',
        description: 'After ending dictation, you can access the Restart button (↻) to clear all text and start over, or the CSV Export button to download your progress. Try clicking on either button to see these features.',
        targetSelector: '#restartBtn', // Start with restart button
        highlightType: 'pulse',
        action: 'click',
        validation: () => {
            // This step completes when user clicks either restart or export button
            return this.exportOptionsInteracted;
        },
        onStart: () => {
            this.exportOptionsInteracted = false;
            // Make sure both buttons are visible by ensuring stats panel is shown
            this.tempHideTutorial = true;
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
        },
        onComplete: () => {
            // Show tutorial overlay again
            this.tempHideTutorial = false;
            if (this.overlay) {
                this.overlay.style.display = 'block';
            }
        }
    }
];

        // Filter out keyboard shortcut steps on mobile
        this.steps = allSteps.filter(step => {
            if (this.isMobile && step.mobileHidden) {
                return false; // Exclude this step on mobile
            }
            return true; // Include this step
        });

        // Log the step count for debugging
        console.log(`Tutorial initialized: ${this.isMobile ? 'Mobile' : 'Desktop'} mode, ${this.steps.length} total steps`);
        console.log('Steps included:', this.steps.map(s => s.id));
    }

    /**
     * Start the tutorial
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        
        // Set global reference for other modules
        window.activeTutorial = this;
        
        this.createTutorialOverlay();
        this.showStep(this.currentStep);
    }

    /**
     * Create the tutorial overlay and UI
     */
    createTutorialOverlay() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorialOverlay';
        this.overlay.className = 'tutorial-overlay';
        this.overlay.style.zIndex = '20000'; // Ensure tutorial is always on top
        
        // Create tutorial container
        this.tutorialContainer = document.createElement('div');
        this.tutorialContainer.className = 'tutorial-container';
        this.tutorialContainer.style.zIndex = '20001'; // Even higher than overlay
        
        // Create tutorial content
        const content = `
            <div class="tutorial-header">
                <div class="tutorial-header-progress">
                    <div class="step-counter">
                        <span class="current-step">1</span> / <span class="total-steps">${this.steps.length + 1}</span>
                    </div>
                    <div class="step-progress">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <button class="tutorial-close" id="tutorialClose">×</button>
            </div>
            <div class="tutorial-content">
                <h3 class="step-title">Welcome to the Tutorial</h3>
                <p class="step-description">Follow the instructions to learn all features.</p>
                <div class="tutorial-actions">
                    <button class="tutorial-btn secondary" id="tutorialPrev">Previous</button>
                    <button class="tutorial-btn primary" id="tutorialNext">Next</button>
                </div>
            </div>
            <div class="tutorial-checkmark" id="tutorialCheckmark" style="display: none;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            </div>
        `;
        
        this.tutorialContainer.innerHTML = content;
        this.overlay.appendChild(this.tutorialContainer);
        document.body.appendChild(this.overlay);
        
        // Setup event listeners
        this.setupTutorialEventListeners();
        
        // Create checkmark element
        this.checkmarkElement = document.getElementById('tutorialCheckmark');
    }

    /**
     * Setup event listeners for tutorial controls
     */
    setupTutorialEventListeners() {
        const closeBtn = document.getElementById('tutorialClose');
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        const skipBtn = document.getElementById('tutorialSkip');
        
        DOMHelpers.addEventListener(closeBtn, 'click', () => this.close());
        DOMHelpers.addEventListener(prevBtn, 'click', () => this.previousStep());
        DOMHelpers.addEventListener(nextBtn, 'click', () => this.nextStep());
        DOMHelpers.addEventListener(skipBtn, 'click', () => this.close());
        
        // Global event listeners for validation
        DOMHelpers.addEventListener(document, 'click', (e) => this.handleGlobalClick(e));
        DOMHelpers.addEventListener(document, 'keydown', (e) => this.handleGlobalKeydown(e));
        // Also add a capture phase listener to catch events early
        DOMHelpers.addEventListener(document, 'keydown', (e) => this.handleCaptureKeydown(e), { capture: true });
        DOMHelpers.addEventListener(document, 'input', (e) => this.handleGlobalInput(e));
    }

    /**
     * Show a specific tutorial step
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        
        // Always start with a clean slate - remove any existing highlights
        this.removeHighlight();
        
        // Update UI
        this.updateTutorialUI(step);
        
        // Highlight target element - using explicit method call
        if (typeof this.addHighlight === 'function') {
            this.addHighlight(step.targetSelector, step.highlightType);
        } else {
            console.error('addHighlight method not found');
        }
        
        // Update progress
        this.updateProgress();
        
        // Call onStart callback if it exists
        if (step.onStart) {
            step.onStart();
        }
    }

    /**
     * Update tutorial UI with current step info
     */
    updateTutorialUI(step) {
        const currentStepEl = document.querySelector('.current-step');
        const titleEl = document.querySelector('.step-title');
        const descriptionEl = document.querySelector('.step-description');
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        
        if (currentStepEl) currentStepEl.textContent = this.currentStep + 1;
        if (titleEl) titleEl.textContent = step.title;
        if (descriptionEl) descriptionEl.textContent = step.description;
        
        // Update button states
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next';
        }
    }

    /**
     * Add highlight to target element
     */
    addHighlight(selector, type = 'pulse') {
        // Always remove existing highlights first
        this.removeHighlight();
        
        // Special handling for export options step - highlight both buttons
        const currentStep = this.steps[this.currentStep];
        if (currentStep && currentStep.id === 'export-options') {
            this.highlightExportOptions();
            return;
        }
        
        const element = document.querySelector(selector);
        if (!element) {
            console.warn('Tutorial target element not found:', selector);
            return;
        }
        
        // Make sure the target element is visible and clickable
        element.classList.add('tutorial-target');
        
        // Get element position
        const rect = element.getBoundingClientRect();
        
        // Position tutorial dialog to avoid covering the highlighted element
        this.positionTutorialDialog(rect, selector);
        
        // Skip creating highlight overlay for text input fields to avoid visual overlap
        if (selector.includes('userInput')) {
            // Just ensure element is visible and focused, but don't add highlight overlay
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // Create highlight overlay for other elements (buttons, etc.)
        const highlight = document.createElement('div');
        highlight.className = `tutorial-highlight tutorial-highlight-${type}`;
        
        // For buttons: circular highlight
        const size = Math.min(100, Math.max(rect.width, rect.height) + 24);
        const width = size;
        const height = size;
        const borderRadius = '50%';
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        highlight.style.position = 'fixed';
        highlight.style.left = (centerX - width / 2) + 'px';
        highlight.style.top = (centerY - height / 2) + 'px';
        highlight.style.width = width + 'px';
        highlight.style.height = height + 'px';
        highlight.style.borderRadius = borderRadius;
        highlight.style.zIndex = '15000';
        highlight.style.pointerEvents = 'none';
        
        document.body.appendChild(highlight);
        this.highlightElement = highlight;
        
        // Ensure element is visible and force repaint
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Highlight both restart and export CSV buttons for the export options step
     */
    highlightExportOptions() {
        const restartBtn = document.getElementById('restartBtn');
        const exportBtn = document.getElementById('exportCsvBtn');
        
        // Create highlights for both buttons
        [restartBtn, exportBtn].forEach((btn, index) => {
            if (!btn) return;
            
            btn.classList.add('tutorial-target');
            const rect = btn.getBoundingClientRect();
            
            const highlight = document.createElement('div');
            highlight.className = 'tutorial-highlight tutorial-highlight-pulse';
            
            const size = Math.min(100, Math.max(rect.width, rect.height) + 24);
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            highlight.style.position = 'fixed';
            highlight.style.left = (centerX - size / 2) + 'px';
            highlight.style.top = (centerY - size / 2) + 'px';
            highlight.style.width = size + 'px';
            highlight.style.height = size + 'px';
            highlight.style.borderRadius = '50%';
            highlight.style.zIndex = '15000';
            highlight.style.pointerEvents = 'none';
            
            // Stagger the animation slightly for visual appeal
            highlight.style.animationDelay = (index * 0.2) + 's';
            
            document.body.appendChild(highlight);
            
            // Store reference for cleanup (store in array for multiple highlights)
            if (!this.multipleHighlights) {
                this.multipleHighlights = [];
            }
            this.multipleHighlights.push(highlight);
        });
        
        // Position tutorial dialog near the buttons
        if (restartBtn) {
            const rect = restartBtn.getBoundingClientRect();
            this.positionTutorialDialog(rect, '#restartBtn');
        }
    }

    /**
     * Create a spotlight effect around the target element
     */
    createSpotlight(rect) {
        const spotlight = document.createElement('div');
        spotlight.className = 'tutorial-spotlight';
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const size = Math.max(rect.width, rect.height) + 100;
        
        spotlight.style.position = 'fixed'; // Use fixed positioning
        spotlight.style.left = (centerX - size / 2) + 'px';
        spotlight.style.top = (centerY - size / 2) + 'px';
        spotlight.style.width = size + 'px';
        spotlight.style.height = size + 'px';
        spotlight.style.background = 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.3) 70%)';
        spotlight.style.borderRadius = '50%';
        spotlight.style.zIndex = '14000';
        spotlight.style.pointerEvents = 'none';
        spotlight.style.animation = 'spotlightPulse 2s infinite';
        
        document.body.appendChild(spotlight);
        this.spotlightElement = spotlight;
    }

    /**
     * Remove highlight
     */
    removeHighlight() {
        // Remove any existing highlight elements by class
        const existingHighlights = document.querySelectorAll('.tutorial-highlight');
        existingHighlights.forEach(el => {
            el.remove();
        });
        
        // Remove specific tracked elements
        if (this.highlightElement) {
            this.highlightElement.remove();
            this.highlightElement = null;
        }
        
        // Remove multiple highlights (for export options step)
        if (this.multipleHighlights) {
            this.multipleHighlights.forEach(highlight => {
                if (highlight.parentNode) {
                    highlight.remove();
                }
            });
            this.multipleHighlights = null;
        }
        
        if (this.spotlightElement) {
            this.spotlightElement.remove();
            this.spotlightElement = null;
        }
        
        // Remove target class from all elements
        const targetElements = document.querySelectorAll('.tutorial-target');
        targetElements.forEach(el => {
            el.classList.remove('tutorial-target');
        });
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            // Total steps includes the completion screen
            const totalSteps = this.steps.length + 1;
            const progress = ((this.currentStep + 1) / totalSteps) * 100;
            progressFill.style.width = progress + '%';
        }
    }

    /**
     * Show success checkmark
     */
    showCheckmark() {
        if (this.checkmarkElement) {
            // Position checkmark over the close button
            const closeButton = document.getElementById('tutorialClose');
            if (closeButton) {
                const closeRect = closeButton.getBoundingClientRect();
                const containerRect = this.tutorialContainer.getBoundingClientRect();
                
                // Calculate position relative to tutorial container
                const centerX = closeRect.left + closeRect.width/2 - containerRect.left;
                const centerY = closeRect.top + closeRect.height/2 - containerRect.top;
                
                // Position checkmark centered over close button
                this.checkmarkElement.style.left = (centerX - 24) + 'px'; // 24 = half of checkmark width
                this.checkmarkElement.style.top = (centerY - 24) + 'px';  // 24 = half of checkmark height
            }
            
            this.checkmarkElement.style.display = 'block';
            this.checkmarkElement.classList.add('tutorial-checkmark-show');
            
            // Hide after animation
            setTimeout(() => {
                this.checkmarkElement.style.display = 'none';
                this.checkmarkElement.classList.remove('tutorial-checkmark-show');
            }, 1500);
        }
    }

    /**
     * Handle global clicks for validation
     */
    handleGlobalClick(event) {
        if (!this.isActive) return;
        
        const currentStep = this.steps[this.currentStep];
        
        // Special handling for export options step - track clicks on restart and export buttons
        if (currentStep.id === 'export-options') {
            const restartBtn = document.getElementById('restartBtn');
            const exportBtn = document.getElementById('exportCsvBtn');
            
            if (restartBtn && (event.target === restartBtn || restartBtn.contains(event.target))) {
                console.log('Restart button clicked during export options step');
                this.exportOptionsInteracted = true;
                setTimeout(() => {
                    if (currentStep.validation && currentStep.validation()) {
                        this.stepCompleted();
                    }
                }, 100);
                return;
            }
            
            if (exportBtn && (event.target === exportBtn || exportBtn.contains(event.target))) {
                console.log('Export CSV button clicked during export options step');
                this.exportOptionsInteracted = true;
                setTimeout(() => {
                    if (currentStep.validation && currentStep.validation()) {
                        this.stepCompleted();
                    }
                }, 100);
                return;
            }
        }
        
        // Special handling for end dictation step
        if (currentStep.id === 'close-button') {
            const endBtn = document.getElementById('endDictationBtn');
            if (endBtn && (event.target === endBtn || endBtn.contains(event.target))) {
                console.log('End dictation button clicked during close button step');
                // Prevent the actual end dictation action, just advance to next step
                event.preventDefault();
                event.stopPropagation();
                this.stepCompleted();
                return;
            }
        }
        
        if (currentStep.action !== 'click' && currentStep.action !== 'doubleclick') return;
        
        const target = document.querySelector(currentStep.targetSelector);
        if (target && (event.target === target || target.contains(event.target))) {
            
            // Handle double-click detection
            if (currentStep.action === 'doubleclick') {
                if (!this.doubleClickTracker) {
                    this.doubleClickTracker = { clicks: 0, lastClickTime: 0 };
                }
                
                const now = Date.now();
                const timeSinceLastClick = now - this.doubleClickTracker.lastClickTime;
                
                if (timeSinceLastClick < 500) { // 500ms window for double-click
                    this.doubleClickTracker.clicks++;
                    if (this.doubleClickTracker.clicks >= 2) {
                        console.log('🖱️ Double-click detected!');
                        // Execute double-click action - repeat sentence
                        if (this.app.audioPlayer) {
                            this.app.audioPlayer.playCurrentSentence();
                        }
                        
                        // Reset tracker
                        this.doubleClickTracker = { clicks: 0, lastClickTime: 0 };
                        
                        // Validate after a delay
                        setTimeout(() => {
                            if (currentStep.validation && currentStep.validation()) {
                                this.stepCompleted();
                            }
                        }, 100);
                        return;
                    }
                } else {
                    // Reset if too much time has passed
                    this.doubleClickTracker.clicks = 1;
                }
                
                this.doubleClickTracker.lastClickTime = now;
                return;
            }
            
            // Handle regular single clicks
            if (currentStep.action === 'click') {
                // Call onInteraction callback if it exists
                if (currentStep.onInteraction) {
                    currentStep.onInteraction();
                }
                
                // Give a small delay for the action to take effect
                setTimeout(() => {
                    if (currentStep.validation && currentStep.validation()) {
                        this.stepCompleted();
                    }
                }, 100);
            }
        }
    }

    /**
     * Handle keydown events in capture phase for debugging
     */
    handleCaptureKeydown(event) {
        if (!this.isActive) return;
        
        const currentStep = this.steps[this.currentStep];
        if (currentStep && currentStep.action === 'keyboard') {
            console.log('🎯 TUTORIAL CAPTURE PHASE KEYDOWN:');
            console.log('  Event:', {
                key: event.key,
                code: event.code,
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                altKey: event.altKey,
                type: event.type,
                target: event.target.tagName,
                defaultPrevented: event.defaultPrevented,
                propagationStopped: event.cancelBubble,
                phase: 'CAPTURE'
            });
        }
    }

    /**
     * Handle global keydown events for validation
     */
    handleGlobalKeydown(event) {
        // Log ALL events when tutorial is active for debugging
        if (this.isActive) {
            console.log('🎯 TUTORIAL ALL KEYDOWN EVENTS:');
            console.log('  Event:', {
                key: event.key,
                code: event.code,
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                altKey: event.altKey,
                type: event.type,
                target: event.target.tagName,
                defaultPrevented: event.defaultPrevented,
                propagationStopped: event.cancelBubble
            });
        }
        
        if (!this.isActive) return;
        
        // Prevent processing events during keyboard step validation
        if (this.validatingKeyboardStep) {
            console.log('  🚫 Ignoring event during keyboard step validation');
            return;
        }
        
        const currentStep = this.steps[this.currentStep];
        if (currentStep.action !== 'keyboard') return;
        
        console.log('🎯 TUTORIAL KEYDOWN DEBUG:');
        console.log('  Step:', currentStep.id);
        console.log('  Expected keyCombo:', currentStep.keyCombo);
        console.log('  Event details:', {
            key: event.key,
            code: event.code,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            repeat: event.repeat
        });
        console.log('  Event defaultPrevented:', event.defaultPrevented);
        console.log('  Event propagationStopped:', event.cancelBubble);
        
        // Check if the key combination matches
        const isMatch = this.isKeyComboMatch(event, currentStep.keyCombo);
        console.log('  Key combo match result:', isMatch);
        
        if (isMatch) {
            console.log('  ✅ Tutorial: Key combo matched! Executing the actual shortcut action...');
            
            // Prevent any auto-advancement during keyboard step validation
            this.validatingKeyboardStep = true;
            
            // Execute the actual keyboard shortcut action first
            this.executeKeyboardShortcutAction(currentStep.keyCombo);
            
            // Then validate after a delay
            setTimeout(() => {
                if (currentStep.validation) {
                    const validationResult = currentStep.validation();
                    console.log('  Validation result:', validationResult);
                    if (validationResult) {
                        console.log('  ✅ Step completed successfully!');
                        this.validatingKeyboardStep = false;
                        this.stepCompleted();
                    } else {
                        console.log('  ⏳ Validation failed, trying again in 200ms...');
                        // Try again with longer delay
                        setTimeout(() => {
                            const retryResult = currentStep.validation();
                            console.log('  Retry validation result:', retryResult);
                            if (retryResult) {
                                console.log('  ✅ Step completed on retry!');
                                this.validatingKeyboardStep = false;
                                this.stepCompleted();
                            } else {
                                console.log('  ❌ Step validation failed even on retry');
                                this.validatingKeyboardStep = false;
                            }
                        }, 200);
                    }
                } else {
                    this.validatingKeyboardStep = false;
                }
            }, 150);
        } else {
            console.log('  ❌ Key combo did not match');
        }
    }

    /**
     * Check if key combination matches
     */
    isKeyComboMatch(event, keyCombo) {
        console.log('  🔍 DETAILED KEY MATCH CHECK:');
        console.log('    Expected keyCombo:', keyCombo);
        console.log('    Event modifiers:', {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey
        });
        console.log('    Event key:', event.key);
        console.log('    Platform check - isMac:', navigator.platform.toUpperCase().indexOf('MAC') >= 0);
        
        if (!keyCombo || keyCombo.length === 0) {
            console.log('    ❌ Invalid keyCombo provided');
            return false;
        }
        
        const modifiers = {
            'Shift': event.shiftKey,
            'Ctrl': event.ctrlKey,
            'Meta': event.metaKey,
            'Alt': event.altKey
        };
        
        console.log('    Checking each key in combo:');
        
        // Handle cross-platform: Meta on Mac, Ctrl on Windows/Linux
        if (keyCombo.includes('Meta')) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            console.log('    Meta key expected, platform is Mac:', isMac);
            if (isMac && !event.metaKey) {
                console.log('    ❌ Meta key required but not pressed on Mac');
                return false;
            }
            if (!isMac && !event.ctrlKey) {
                console.log('    ❌ Ctrl key required but not pressed on non-Mac');
                return false;
            }
            console.log('    ✅ Meta/Ctrl platform check passed');
        }
        
        // Check all required modifiers and keys
        for (const key of keyCombo) {
            console.log('    Checking key:', key);
            if (key in modifiers) {
                if (!modifiers[key]) {
                    console.log('    ❌ Modifier', key, 'required but not pressed');
                    return false;
                } else {
                    console.log('    ✅ Modifier', key, 'is pressed');
                }
            } else {
                // This is the main key (not a modifier)
                // Special handling for hint shortcut alternatives
                if (key === 'ß') {
                    // For hint shortcut, accept ß, /, or , as alternatives
                    if (event.key !== 'ß' && event.key !== '/' && event.key !== ',') {
                        console.log('    ❌ Hint key mismatch. Expected: ß, /, or , Got:', event.key);
                        return false;
                    } else {
                        console.log('    ✅ Hint key matches:', event.key);
                    }
                } else {
                    // Regular key matching
                    if (event.key !== key && event.code !== key) {
                        console.log('    ❌ Main key mismatch. Expected:', key, 'Got:', event.key, '/', event.code);
                        return false;
                    } else {
                        console.log('    ✅ Main key matches:', key);
                    }
                }
            }
        }
        
        console.log('    ✅ ALL CHECKS PASSED - Key combo matches!');
        return true;
    }

    /**
     * Handle global input events for typing validation
     */
    handleGlobalInput(event) {
        if (!this.isActive) return;
        
        // Prevent typing validation during keyboard step validation
        if (this.validatingKeyboardStep) {
            console.log('  🚫 Ignoring input event during keyboard step validation');
            // Clear any unwanted input that might have been generated by shortcuts
            if (event.target && event.target.value) {
                console.log('  🧹 Clearing unwanted input:', event.target.value);
                event.target.value = '';
            }
            return;
        }
        
        const currentStep = this.steps[this.currentStep];
        if (currentStep.action !== 'typing') return;
        
        const target = document.querySelector(currentStep.targetSelector);
        if (target && event.target === target) {
            // Give a small delay for the input to be processed
            setTimeout(() => {
                if (currentStep.validation && currentStep.validation()) {
                    this.stepCompleted();
                }
            }, 100);
        }
    }

    /**
     * Handle step completion
     */
    stepCompleted() {
        const currentStep = this.steps[this.currentStep];
        
        // Remove highlight immediately when step is completed
        this.removeHighlight();
        
        // Show checkmark
        this.showCheckmark();
        
        // Call onComplete callback if exists
        if (currentStep.onComplete) {
            currentStep.onComplete();
        }
        
        // Auto-advance to next step after a delay
        setTimeout(() => {
            this.nextStep();
        }, 1000);
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Complete tutorial
     */
    completeTutorial() {
        // Show completion message
        const titleEl = document.querySelector('.step-title');
        const descriptionEl = document.querySelector('.step-description');
        const nextBtn = document.getElementById('tutorialNext');
        const skipBtn = document.getElementById('tutorialSkip');
        const currentStepEl = document.querySelector('.current-step');
        
        if (titleEl) titleEl.textContent = 'Tutorial Complete!';
        if (descriptionEl) descriptionEl.textContent = 'You have learned all the essential features. You can now use the dictation tool effectively!';
        if (nextBtn) {
            nextBtn.textContent = 'Start Using the Tool';
            nextBtn.onclick = () => this.close();
        }
        
        // Hide the "Skip Tutorial" button on the completion screen
        if (skipBtn) {
            skipBtn.style.display = 'none';
        }
        
        // Update step counter to show final step
        if (currentStepEl) currentStepEl.textContent = this.steps.length + 1;
        
        // Update progress bar to 100%
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }
        
        this.removeHighlight();
    }

    /**
     * Close tutorial
     */
    close() {
        this.isActive = false;
        this.removeHighlight();
        
        // Clear global reference
        window.activeTutorial = null;
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        this.tutorialContainer = null;
        this.checkmarkElement = null;
    }
    
    /**
     * Position tutorial dialog to avoid covering the highlighted element
     */
    positionTutorialDialog(rect, selector) {
        if (!this.overlay) return;
        
        // For certain steps, keep the same position as the previous step
        const currentStepId = this.steps[this.currentStep]?.id;
        if (currentStepId === 'typing-practice-1' || 
            currentStepId === 'hint-button' ||
            currentStepId === 'keyboard-hint' ||
            currentStepId === 'typing-practice-2' ||
            currentStepId === 'case-sensitivity' ||
            currentStepId === 'focus-mode' ||
            currentStepId === 'close-button' ||
            currentStepId === 'export-options') {
            // Don't change position for:
            // - slide 3 (typing-practice-1)
            // - slide 10 (hint-button)
            // - slide 11 (keyboard-hint)
            // - slide 12 (typing-practice-2) 
            // - slide 13 (case-sensitivity)
            // - slide 14 (focus-mode)
            // - slide 15 (close-button)
            // - slide 16 (export-options)
            // Keep the existing position classes from the previous step
            return;
        }
        
        // Remove existing position classes
        this.overlay.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const isMobile = windowWidth <= 768;
        
        // Get element center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (isMobile) {
            // On mobile, position based on element location
            if (centerY < windowHeight / 2) {
                // Element in top half, put dialog at bottom
                this.overlay.classList.add('position-bottom');
            } else {
                // Element in bottom half, put dialog at top
                this.overlay.classList.add('position-top');
            }
        } else {
            // On desktop, use intelligent positioning
            if (selector.includes('playBtn') || selector.includes('nextBtn') || selector.includes('prevBtn') || selector.includes('speedBtn')) {
                // Audio control buttons - position to the right
                this.overlay.classList.add('position-right');
            } else if (selector.includes('userInput')) {
                // Text input area - ALWAYS position above to avoid overlap
                this.overlay.classList.add('position-top');
            } else if (selector.includes('hintBtn') || selector.includes('ignoreCaseBtn') || selector.includes('focusModeBtn')) {
                // Lower buttons - position at bottom
                this.overlay.classList.add('position-bottom');
            } else if (selector.includes('endDictationBtn')) {
                // End dictation button - position at bottom left
                this.overlay.classList.add('position-bottom');
            } else if (selector.includes('restartBtn') || selector.includes('exportCsvBtn')) {
                // Restart and export CSV buttons - position at bottom
                this.overlay.classList.add('position-bottom');
            } else {
                // Default positioning to the right
                this.overlay.classList.add('position-right');
            }
        }
    }
    
    /**
     * Check if tutorial is currently active and handling keyboard events
     */
    static isTutorialActive() {
        return window.activeTutorial && window.activeTutorial.isActive;
    }

    /**
     * Allow other modules to intercept tutorial keyboard events
     */
    static getCurrentTutorialStep() {
        if (window.activeTutorial && window.activeTutorial.isActive) {
            return window.activeTutorial.steps[window.activeTutorial.currentStep];
        }
        return null;
    }

    /**
     * Set up global keyboard shortcut to start tutorial (Shift+Cmd+I)
     * This should be called during app initialization
     */
    static setupGlobalShortcut(dictationApp) {
        DOMHelpers.addEventListener(document, 'keydown', (event) => {
            // Check for Shift+Cmd+I (or Shift+Ctrl+I on non-Mac)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
            
            if (event.shiftKey && cmdOrCtrl && event.key.toLowerCase() === 'i') {
                // Prevent default behavior
                event.preventDefault();
                event.stopPropagation();
                
                console.log('🎓 Tutorial shortcut detected (Shift+Cmd+I) - Starting tutorial...');
                
                // Check if tutorial is already active
                if (window.activeTutorial && window.activeTutorial.isActive) {
                    console.log('  Tutorial is already active, ignoring shortcut');
                    return;
                }
                
                // Create and start new tutorial
                const tutorial = new Tutorial(dictationApp);
                tutorial.start();
            }
        });
        
        console.log('🎓 Tutorial keyboard shortcut (Shift+Cmd+I) registered globally');
    }

    /**
     * Execute the actual keyboard shortcut action
     */
    executeKeyboardShortcutAction(keyCombo) {
        if (!this.app || !this.app.audioPlayer) {
            console.log('  ❌ App or audioPlayer not available for shortcut execution');
            return;
        }

        // Convert keyCombo to string for comparison
        const comboStr = keyCombo.join('+').toLowerCase();
        
        console.log('  🎬 Executing keyboard shortcut action for:', comboStr);
        
        if (comboStr.includes('enter')) {
            // Play/Pause shortcut
            console.log('  ▶️ Executing play/pause action');
            this.app.audioPlayer.togglePlayback();
        } else if (comboStr.includes('arrowright')) {
            // Next sentence shortcut
            console.log('  ⏭️ Executing next sentence action');
            this.app.audioPlayer.goToNextSentence();
        } else if (comboStr.includes('arrowleft')) {
            // Previous sentence shortcut
            console.log('  ⏮️ Executing previous sentence action');
            this.app.audioPlayer.goToPreviousSentence();
        } else if (comboStr.includes('arrowup')) {
            // Play current sentence shortcut
            console.log('  🔄 Executing play current sentence action');
            this.app.audioPlayer.playCurrentSentence();
        } else if (comboStr.includes('arrowdown')) {
            // Speed toggle shortcut
            console.log('  ⚡ Executing speed toggle action');
            this.app.audioPlayer.toggleSpeed();
        } else if (comboStr.includes('ß') || comboStr.includes('/') || comboStr.includes(',')) {
            // Hint toggle shortcut
            console.log('  💡 Executing hint toggle action');
            // Find and click the hint button
            const hintBtn = document.getElementById('hintBtn');
            if (hintBtn) {
                hintBtn.click();
            }
        } else {
            console.log('  ❓ Unknown keyboard shortcut action for:', comboStr);
        }
    }
}
