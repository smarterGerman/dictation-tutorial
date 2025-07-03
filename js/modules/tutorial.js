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
        
        // Tutorial steps configuration
        this.steps = [
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
                description: 'Click the play button again to pause the audio.',
                targetSelector: '#playBtn',
                highlightType: 'pulse',
                action: 'click',
                validation: () => this.app.audioPlayer && !this.app.audioPlayer.isPlaying
            },
            {
                id: 'next-sentence',
                title: 'Next Sentence',
                description: 'Click the right arrow to move to the next sentence.',
                targetSelector: '#nextBtn',
                highlightType: 'pulse',
                action: 'click',
                validation: () => this.app.audioPlayer && this.app.audioPlayer.currentCueIndex > 0
            },
            {
                id: 'prev-sentence',
                title: 'Previous Sentence',
                description: 'Click the left arrow to go back to the previous sentence.',
                targetSelector: '#prevBtn',
                highlightType: 'pulse',
                action: 'click',
                validation: () => this.app.audioPlayer && this.app.audioPlayer.currentCueIndex === 0
            },
            {
                id: 'speed-control',
                title: 'Speed Control',
                description: 'Click the speed button to change playback speed (100%, 75%, 50%).',
                targetSelector: '#speedBtn',
                highlightType: 'pulse',
                action: 'click',
                validation: () => this.app.audioPlayer && this.app.audioPlayer.currentSpeed !== 1.0
            },
            {
                id: 'keyboard-play',
                title: 'Keyboard Shortcut: Play/Pause',
                description: 'Press Shift + Cmd/Ctrl + Enter to play/pause audio.',
                targetSelector: '#userInput',
                highlightType: 'glow',
                action: 'keyboard',
                keyCombo: ['Shift', 'Meta', 'Enter'], // Will handle cross-platform
                validation: () => this.app.audioPlayer && this.app.audioPlayer.isPlaying
            },
            {
                id: 'keyboard-next',
                title: 'Keyboard Shortcut: Next Sentence',
                description: 'Press Shift + Cmd/Ctrl + → (right arrow) to go to next sentence.',
                targetSelector: '#userInput',
                highlightType: 'glow',
                action: 'keyboard',
                keyCombo: ['Shift', 'Meta', 'ArrowRight'],
                validation: () => this.currentStepStartIndex !== undefined && 
                    this.app.audioPlayer && this.app.audioPlayer.currentCueIndex > this.currentStepStartIndex
            },
            {
                id: 'keyboard-prev',
                title: 'Keyboard Shortcut: Previous Sentence',
                description: 'Press Shift + Cmd/Ctrl + ← (left arrow) to go to previous sentence.',
                targetSelector: '#userInput',
                highlightType: 'glow',
                action: 'keyboard',
                keyCombo: ['Shift', 'Meta', 'ArrowLeft'],
                validation: () => this.currentStepStartIndex !== undefined && 
                    this.app.audioPlayer && this.app.audioPlayer.currentCueIndex < this.currentStepStartIndex
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
                }
            },
            {
                id: 'case-sensitivity',
                title: 'Case Sensitivity Toggle',
                description: 'Click the "Aa" button to toggle case sensitivity on/off.',
                targetSelector: '#ignoreCaseBtn',
                highlightType: 'pulse',
                action: 'click',
                validation: () => {
                    const btn = document.getElementById('ignoreCaseBtn');
                    return btn && btn.classList.contains('active');
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
                }
            }
        ];
    }

    /**
     * Start the tutorial
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
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
        
        // Create tutorial container
        this.tutorialContainer = document.createElement('div');
        this.tutorialContainer.className = 'tutorial-container';
        
        // Create tutorial content
        const content = `
            <div class="tutorial-header">
                <h2 class="tutorial-title">Interactive Tutorial</h2>
                <button class="tutorial-close" id="tutorialClose">×</button>
            </div>
            <div class="tutorial-content">
                <div class="tutorial-step-info">
                    <div class="step-counter">
                        <span class="current-step">1</span> / <span class="total-steps">${this.steps.length}</span>
                    </div>
                    <div class="step-progress">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <h3 class="step-title">Welcome to the Tutorial</h3>
                <p class="step-description">Follow the instructions to learn all features.</p>
                <div class="tutorial-actions">
                    <button class="tutorial-btn secondary" id="tutorialPrev">Previous</button>
                    <button class="tutorial-btn secondary" id="tutorialSkip">Skip Tutorial</button>
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
    }

    /**
     * Show a specific tutorial step
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        
        // Store starting index for relative validations
        if (step.action === 'keyboard' && step.keyCombo && 
            (step.keyCombo.includes('ArrowRight') || step.keyCombo.includes('ArrowLeft'))) {
            this.currentStepStartIndex = this.app.audioPlayer ? this.app.audioPlayer.currentCueIndex : 0;
        }
        
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
        // Remove existing highlights
        this.removeHighlight();
        
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
        
        // Create highlight overlay
        const highlight = document.createElement('div');
        highlight.className = `tutorial-highlight tutorial-highlight-${type}`;
        
        // Make the highlight circular by using the larger dimension
        const size = Math.max(rect.width, rect.height) + 24;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        highlight.style.position = 'fixed';
        highlight.style.left = (centerX - size / 2) + 'px';
        highlight.style.top = (centerY - size / 2) + 'px';
        highlight.style.width = size + 'px';
        highlight.style.height = size + 'px';
        highlight.style.zIndex = '15000';
        highlight.style.pointerEvents = 'none';
        
        document.body.appendChild(highlight);
        this.highlightElement = highlight;
        
        // Ensure element is visible and force repaint
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        if (this.highlightElement) {
            this.highlightElement.remove();
            this.highlightElement = null;
        }
        
        if (this.spotlightElement) {
            this.spotlightElement.remove();
            this.spotlightElement = null;
        }
        
        // Remove target class from all elements
        document.querySelectorAll('.tutorial-target').forEach(el => {
            el.classList.remove('tutorial-target');
        });
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;
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
        if (currentStep.action !== 'click') return;
        
        const target = document.querySelector(currentStep.targetSelector);
        if (target && (event.target === target || target.contains(event.target))) {
            // Give a small delay for the action to take effect
            setTimeout(() => {
                if (currentStep.validation && currentStep.validation()) {
                    this.stepCompleted();
                }
            }, 100);
        }
    }

    /**
     * Handle global keydown events for validation
     */
    handleGlobalKeydown(event) {
        if (!this.isActive) return;
        
        const currentStep = this.steps[this.currentStep];
        if (currentStep.action !== 'keyboard') return;
        
        // Check if the key combination matches
        if (this.isKeyComboMatch(event, currentStep.keyCombo)) {
            // Give a small delay for the action to take effect
            setTimeout(() => {
                if (currentStep.validation && currentStep.validation()) {
                    this.stepCompleted();
                }
            }, 100);
        }
    }

    /**
     * Check if key combination matches
     */
    isKeyComboMatch(event, keyCombo) {
        if (!keyCombo || keyCombo.length === 0) return false;
        
        const modifiers = {
            'Shift': event.shiftKey,
            'Ctrl': event.ctrlKey,
            'Meta': event.metaKey,
            'Alt': event.altKey
        };
        
        // Handle cross-platform: Meta on Mac, Ctrl on Windows/Linux
        if (keyCombo.includes('Meta')) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if (isMac && !event.metaKey) return false;
            if (!isMac && !event.ctrlKey) return false;
        }
        
        // Check all required modifiers
        for (const key of keyCombo) {
            if (key in modifiers && !modifiers[key]) return false;
            if (!(key in modifiers) && event.key !== key && event.code !== key) return false;
        }
        
        return true;
    }

    /**
     * Handle step completion
     */
    stepCompleted() {
        const currentStep = this.steps[this.currentStep];
        
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
        
        if (titleEl) titleEl.textContent = 'Tutorial Complete!';
        if (descriptionEl) descriptionEl.textContent = 'You have learned all the essential features. You can now use the dictation tool effectively!';
        if (nextBtn) {
            nextBtn.textContent = 'Start Using the Tool';
            nextBtn.onclick = () => this.close();
        }
        
        this.removeHighlight();
    }

    /**
     * Close tutorial
     */
    close() {
        this.isActive = false;
        this.removeHighlight();
        
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
                // Text input area - position to the right or left based on space
                if (centerX < windowWidth / 2) {
                    this.overlay.classList.add('position-right');
                } else {
                    this.overlay.classList.add('position-left');
                }
            } else if (selector.includes('hintBtn') || selector.includes('ignoreCaseBtn') || selector.includes('focusModeBtn')) {
                // Lower buttons - position at bottom
                this.overlay.classList.add('position-bottom');
            } else {
                // Default positioning to the right
                this.overlay.classList.add('position-right');
            }
        }
    }
}
