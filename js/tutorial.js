/**
 * Interactive Tutorial for German Dictation Tool
 * Streamlined, focused tutorial that works with the ac            {
                title: "German Characters",
                content: `Type the word <strong>"ueben"</strong> in the text area and see what happens`,
                action: 'typing',
                target: '#userInput',
                expected: 'üben',
                highlight: '#userInput'
            },
            {
                title: "More Umlauts",
                content: `Now try <strong>"bitte laecheln"</strong> - watch the magic happen!`,
                action: 'typing',
                target: '#userInput',
                expected: 'lächeln',
                highlight: '#userInput'
            },
            {
                title: "Final Test",
                content: `Type <strong>"schoen"</strong> and <strong>"ich heisse"</strong> to complete the test`,
                action: 'typing',
                target: '#userInput',
                expected: 'heiße',
                highlight: '#userInput'
            },erface
 */

class DictationTutorial {
    constructor() {
        this.currentStep = 0;
        this.isActive = true;
        this.keyPressListener = null;
        this.clickListener = null;
        
        // Detect platform for keyboard shortcuts
        this.isMac = navigator.platform.toLowerCase().includes('mac');
        this.modKey = this.isMac ? 'meta' : 'ctrl';
        this.modKeyLabel = this.isMac ? 'Cmd' : 'Ctrl';
        
        // Detect keyboard layout for hint key
        this.hintKey = this.detectHintKey();
        
        this.initializeSteps();
    }

    detectHintKey() {
        // Try to detect keyboard layout
        const language = navigator.language || navigator.userLanguage || 'en-US';
        
        if (language.startsWith('de')) {
            return { key: 'ß', label: 'ß' };
        } else if (language.startsWith('fr')) {
            return { key: ',', label: ',' };
        } else {
            return { key: '/', label: '?' };
        }
    }

    initializeSteps() {
        this.steps = [
            {
                title: "Welcome! 👋",
                content: "Let's learn the essentials in 2 minutes",
                action: null,
                highlight: null
            },
            {
                title: "Play Button",
                content: `Click the <strong>play button</strong> to start audio`,
                action: 'click',
                target: '#playBtn',
                highlight: '#playBtn'
            },
            {
                title: "Keyboard Shortcut",
                content: `Press <kbd>Shift + ${this.modKeyLabel} + Enter</kbd> to play/pause`,
                action: 'keypress',
                target: `shift+${this.modKey}+enter`,
                highlight: '#playBtn'
            },
            {
                title: "Next Sentence",
                content: `Click <strong>›</strong> or press <kbd>Shift + ${this.modKeyLabel} + →</kbd>`,
                action: 'keypress',
                target: `shift+${this.modKey}+arrowright`,
                highlight: '#nextBtn'
            },
            {
                title: "Previous Sentence", 
                content: `Click <strong>‹</strong> or press <kbd>Shift + ${this.modKeyLabel} + ←</kbd>`,
                action: 'keypress',
                target: `shift+${this.modKey}+arrowleft`,
                highlight: '#prevBtn'
            },
            {
                title: "Speed Control",
                content: `Click the <strong>speed button</strong> 3 times to cycle through speeds`,
                action: 'multiclick',
                target: '#speedBtn',
                clicksRequired: 3,
                clicksCount: 0,
                highlight: '#speedBtn'
            },
            {
                title: "Speed Shortcut",
                content: `Press <kbd>Shift + ${this.modKeyLabel} + ↓</kbd> to toggle speed`,
                action: 'keypress',
                target: `shift+${this.modKey}+arrowdown`,
                highlight: '#speedBtn'
            },
            {
                title: "Repeat Current",
                content: `Press <kbd>Shift + ${this.modKeyLabel} + ↑</kbd> to repeat current sentence`,
                action: 'keypress',
                target: `shift+${this.modKey}+arrowup`,
                highlight: '#playBtn'
            },
            {
                title: "Get Hints",
                content: `Click <strong>?</strong> when you need help`,
                action: 'click',
                target: '#hintBtn',
                highlight: '#hintBtn'
            },
            {
                title: "Hint Shortcut",
                content: `Press <kbd>Shift + ${this.modKeyLabel} + ?</kbd> (or <kbd>ß</kbd>, <kbd>,</kbd>) for hints`,
                action: 'keypress',
                target: `shift+${this.modKey}+/`,
                highlight: '#hintBtn'
            },
            {
                title: "German Characters",
                content: `Type "ue" in the text area - it becomes "ü" automatically`,
                action: 'typing',
                target: '#userInput',
                expected: 'ü',
                highlight: '#userInput'
            },
            {
                title: "All Set! 🎉",
                content: `You've learned all the essential shortcuts and controls!`,
                action: null,
                highlight: null
            }
        ];
        
        this.initialize();
    }

    initialize() {
        // Load actual dictation app first
        this.loadMainApp();
        
        // Setup tutorial overlay
        this.setupEventListeners();
        
        // Show tutorial with animation
        setTimeout(() => {
            const modal = document.getElementById('tutorialModal');
            if (modal) {
                modal.classList.add('show');
            }
            this.renderCurrentStep();
        }, 500);
    }

    async loadMainApp() {
        try {
            // Load the actual app so tutorial works with real interface
            const { DictationApp } = await import('./app.js');
            this.app = new DictationApp();
            await this.app.initialize();
            console.log('Main app loaded for tutorial');
        } catch (error) {
            console.error('Could not load main app for tutorial:', error);
        }
    }

    setupEventListeners() {
        try {
            // Tutorial navigation
            const tutorialNext = document.getElementById('tutorialNext');
            const tutorialPrev = document.getElementById('tutorialPrev');
            const tutorialSkip = document.getElementById('tutorialSkip');
            const tutorialClose = document.getElementById('tutorialClose');
            
            if (tutorialNext) tutorialNext.addEventListener('click', () => this.nextStep());
            if (tutorialPrev) tutorialPrev.addEventListener('click', () => this.prevStep());
            if (tutorialSkip) tutorialSkip.addEventListener('click', () => this.closeTutorial());
            if (tutorialClose) tutorialClose.addEventListener('click', () => this.closeTutorial());

            // Global keyboard listener for shortcuts - use highest priority
            this.keyPressListener = (e) => this.handleKeyPress(e);
            document.addEventListener('keydown', this.keyPressListener, {
                capture: true,
                passive: false
            });

            // Click listener for interactive elements
            this.clickListener = (e) => this.handleClick(e);
            document.addEventListener('click', this.clickListener, true);

            // Input listener for typing exercises
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.addEventListener('input', (e) => this.handleInput(e));
            }
            
            console.log('Tutorial event listeners setup successfully');
        } catch (error) {
            console.error('Error setting up tutorial event listeners:', error);
        }
    }

    renderCurrentStep() {
        try {
            const step = this.steps[this.currentStep];
            
            // Reset click counter for multiclick steps
            if (step.action === 'multiclick') {
                step.clicksCount = 0;
            }
            
            // Update header
            const titleElement = document.getElementById('tutorialTitle');
            const subtitleElement = document.getElementById('tutorialSubtitle');
            const contentElement = document.getElementById('tutorialContent');
            
            if (titleElement) titleElement.innerHTML = step.title;
            if (subtitleElement) subtitleElement.style.display = 'none'; // No subtitle in compact mode
            
            // Create simple content
            let content = `<div class="step-description">${step.content}</div>`;
            
            // No try-it box anymore - just the description
            
            if (contentElement) contentElement.innerHTML = content;
            
            // Update progress
            this.updateProgress();
            
            // Update navigation buttons
            this.updateNavigationButtons();
            
            // Apply highlighting
            this.applyHighlight(step.highlight);
            
            console.log(`Tutorial step ${this.currentStep + 1}/${this.steps.length}: ${step.title}`);
        } catch (error) {
            console.error('Error rendering tutorial step:', error);
        }
    }

    updateProgress() {
        const progressContainer = document.getElementById('tutorialProgress');
        progressContainer.innerHTML = '';
        
        this.steps.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            
            if (index < this.currentStep) {
                dot.classList.add('completed');
            } else if (index === this.currentStep) {
                dot.classList.add('active');
            }
            
            progressContainer.appendChild(dot);
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        const skipBtn = document.getElementById('tutorialSkip');
        
        // Previous button
        if (prevBtn) prevBtn.style.display = this.currentStep > 0 ? 'block' : 'none';
        
        // Next/Finish button
        if (nextBtn) {
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.textContent = 'Start Practicing!';
            } else {
                nextBtn.textContent = 'Next';
            }
        }
        
        // Skip button (always show except on last step)
        if (skipBtn) {
            skipBtn.style.display = this.currentStep === this.steps.length - 1 ? 'none' : 'block';
        }
    }

    applyHighlight(selector) {
        // Remove existing highlights and background darkening
        document.querySelectorAll('.button-highlight').forEach(el => {
            el.classList.remove('button-highlight');
        });
        
        const overlay = document.getElementById('tutorialOverlay');
        const modal = document.getElementById('tutorialModal');
        
        // Apply new highlight
        if (selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('button-highlight');
                
                // Add class to body for CSS targeting
                document.body.classList.add('tutorial-dimming');
                console.log(`Tutorial: Added tutorial-dimming class to body`);
                console.log(`Tutorial: Body classes:`, document.body.className);
                
                // SPOTLIGHT APPROACH: Create overlay with cutout instead of dimming
                this.createSpotlight(element);
                
                // Debug: Check if class was applied
                console.log(`Tutorial: Applied highlight class to:`, element);
                console.log(`Tutorial: Element classes:`, element.className);
                console.log(`Tutorial: Element computed style:`, window.getComputedStyle(element).filter);
                
                // Darken background but keep highlighted element bright
                if (overlay) overlay.classList.add('darken-background');
                
                // Adjust tutorial position to avoid covering the highlighted element
                this.adjustTutorialPosition(element, modal);
                
                console.log(`Tutorial: Highlighting element: ${selector}`);
            } else {
                console.error(`Tutorial: Could not find element: ${selector}`);
            }
        } else {
            // Remove background darkening when no highlight
            if (overlay) overlay.classList.remove('darken-background');
            document.body.classList.remove('tutorial-dimming');
            this.removeSpotlight();
            // Reset tutorial position
            if (modal) {
                modal.style.marginTop = '120px';
                modal.style.marginLeft = '0';
            }
        }
    }

    createSpotlight(highlightedElement) {
        // Remove any existing spotlight
        this.removeSpotlight();

        // Get element position and size
        const rect = highlightedElement.getBoundingClientRect();
        const padding = 10; // Extra space around element

        // Create overlay div
        const spotlight = document.createElement('div');
        spotlight.id = 'tutorial-spotlight';
        spotlight.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            pointer-events: none;
            transition: all 0.4s ease;
            clip-path: polygon(
                0% 0%, 
                0% 100%, 
                ${rect.left - padding}px 100%, 
                ${rect.left - padding}px ${rect.top - padding}px, 
                ${rect.right + padding}px ${rect.top - padding}px, 
                ${rect.right + padding}px ${rect.bottom + padding}px, 
                ${rect.left - padding}px ${rect.bottom + padding}px, 
                ${rect.left - padding}px 100%, 
                100% 100%, 
                100% 0%
            );
        `;

        // Append overlay to .container instead of body
        const container = document.querySelector('.container');
        if (container) {
            container.style.position = 'relative';
            container.style.zIndex = '0';
            container.appendChild(spotlight);
        } else {
            document.body.appendChild(spotlight);
        }

        // Walk up the DOM tree and set z-index on all ancestors up to .container
        let ancestor = highlightedElement;
        while (ancestor && ancestor !== document.body) {
            ancestor.style.position = 'relative';
            ancestor.style.zIndex = '2002';
            if (ancestor.classList && ancestor.classList.contains('container')) break;
            ancestor = ancestor.parentElement;
        }

        // Ensure highlighted element is on top
        highlightedElement.style.position = 'relative';
        highlightedElement.style.zIndex = '2003';

        console.log(`Tutorial: Created spotlight for element at (${rect.left}, ${rect.top}, ${rect.width}x${rect.height}) and set z-index on ancestors (overlay in .container)`);
    }

    removeSpotlight() {
        const existing = document.getElementById('tutorial-spotlight');
        if (existing) {
            existing.remove();
        }
        
        // Reset highlighted element z-index
        const highlighted = document.querySelector('.button-highlight');
        if (highlighted) {
            highlighted.style.zIndex = '';
        }
        
        console.log(`Tutorial: Removed spotlight`);
    }

    adjustTutorialPosition(highlightedElement, modal) {
        if (!modal || !highlightedElement) return;
        
        const rect = highlightedElement.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // If the highlighted element is in the upper part of the screen,
        // move tutorial lower to avoid covering it
        if (rect.top < windowHeight / 2) {
            const newMarginTop = Math.max(rect.bottom + 20, 120);
            modal.style.marginTop = `${newMarginTop}px`;
        } else {
            // Keep tutorial in upper right
            modal.style.marginTop = '120px';
        }
        
        // If highlighted element is on the right side, move tutorial left
        if (rect.right > windowWidth - 350) {
            modal.style.marginLeft = '-380px';
        } else {
            modal.style.marginLeft = '0';
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderCurrentStep();
        } else {
            this.closeTutorial();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderCurrentStep();
        }
    }

    closeTutorial() {
        this.isActive = false;
        
        // Remove event listeners
        if (this.keyPressListener) {
            document.removeEventListener('keydown', this.keyPressListener, {
                capture: true,
                passive: false
            });
        }
        if (this.clickListener) {
            document.removeEventListener('click', this.clickListener, true);
        }
        
        // Remove highlights and background darkening
        this.applyHighlight(null);
        
        // Hide tutorial overlay with animation
        const modal = document.getElementById('tutorialModal');
        const overlay = document.getElementById('tutorialOverlay');
        
        if (modal) {
            modal.classList.remove('show');
        }
        
        setTimeout(() => {
            if (overlay) {
                overlay.style.display = 'none';
            }
        }, 300);
        
        console.log('Tutorial completed successfully');
    }

    handleKeyPress(e) {
        if (!this.isActive) return true;
        
        const step = this.steps[this.currentStep];
        if (step.action === 'keypress') {
            const combo = this.getKeyCombo(e);
            
            console.log(`Tutorial: Step expects "${step.target}", got "${combo}"`);
            
            // Check both Mac and Windows/Linux variants
            let matches = false;
            if (combo === step.target || 
                combo === step.target.replace('meta', 'ctrl') ||
                combo === step.target.replace('ctrl', 'meta')) {
                matches = true;
            }
            
            // Special handling for hint shortcuts - accept ß, /, or , on any keyboard
            if (step.target.includes('ß') || step.target.includes('/') || step.target.includes(',')) {
                const baseCombo = combo.split('+').slice(0, -1).join('+');
                const expectedBase = step.target.split('+').slice(0, -1).join('+');
                const pressedKey = combo.split('+').pop();
                
                if (baseCombo === expectedBase && (pressedKey === 'ß' || pressedKey === '/' || pressedKey === ',')) {
                    matches = true;
                }
            }
            
            if (matches) {
                // Prevent the event from propagating to the main app
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`Tutorial: Correct keypress detected: ${combo}`);
                this.markStepCompleted();
                return false;
            }
        }
        
        // Let other keyboard events through to the main app
        return true;
    }

    handleClick(e) {
        if (!this.isActive) return;
        
        const step = this.steps[this.currentStep];
        if (step.action === 'click') {
            const target = e.target.closest(step.target);
            if (target) {
                this.markStepCompleted();
            }
        } else if (step.action === 'multiclick') {
            const target = e.target.closest(step.target);
            if (target) {
                step.clicksCount = (step.clicksCount || 0) + 1;
                console.log(`Tutorial: Speed button clicked ${step.clicksCount}/${step.clicksRequired} times`);
                
                // Update the tutorial content to show progress
                const contentElement = document.getElementById('tutorialContent');
                if (contentElement) {
                    const description = contentElement.querySelector('.step-description');
                    if (description && step.clicksCount < step.clicksRequired) {
                        const remaining = step.clicksRequired - step.clicksCount;
                        description.innerHTML = `Click the <strong>speed button</strong> ${remaining} more time${remaining === 1 ? '' : 's'}`;
                    }
                }
                
                if (step.clicksCount >= step.clicksRequired) {
                    this.markStepCompleted();
                }
            }
        }
    }

    handleInput(e) {
        if (!this.isActive) return;
        
        const step = this.steps[this.currentStep];
        if (step.action === 'typing') {
            const value = e.target.value.toLowerCase();
            const expected = step.expected.toLowerCase();
            
            // For German character steps, check for any of the expected transformations
            let success = false;
            if (step.title === "German Characters") {
                success = value.includes('üben') || value.includes('ü');
            } else if (step.title === "More Umlauts") {
                success = value.includes('lächeln') || value.includes('ä');
            } else if (step.title === "Final Test") {
                success = value.includes('schön') || value.includes('heiße') || 
                         value.includes('ö') || value.includes('ß');
            } else {
                success = value.includes(expected);
            }
            
            if (success) {
                this.markStepCompleted();
            }
        }
    }

    markStepCompleted() {
        // Show success indicator in the tutorial content area
        const contentElement = document.getElementById('tutorialContent');
        if (contentElement && !contentElement.querySelector('.success-message')) {
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = '✅ Perfect!';
            successMessage.style.color = '#10b981';
            successMessage.style.fontWeight = '600';
            successMessage.style.marginTop = '0.75rem';
            successMessage.style.fontSize = '0.9rem';
            successMessage.style.textAlign = 'center';
            successMessage.style.padding = '0.5rem';
            successMessage.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)';
            successMessage.style.border = '1px solid #bbf7d0';
            successMessage.style.borderRadius = '12px';
            contentElement.appendChild(successMessage);
        }
        
        // Auto-advance after longer delay for better feedback
        setTimeout(() => {
            if (this.isActive) {
                this.nextStep();
            }
        }, 1200);
    }

    getKeyCombo(e) {
        const parts = [];
        
        if (e.shiftKey) parts.push('shift');
        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey) parts.push('meta');
        if (e.altKey) parts.push('alt');
        
        // Map special keys to match the main app's format
        const keyMap = {
            'Enter': 'enter',
            'ArrowLeft': 'arrowleft',
            'ArrowRight': 'arrowright', 
            'ArrowUp': 'arrowup',
            'ArrowDown': 'arrowdown',
            'Escape': 'esc',
            ' ': 'space'
        };
        
        let key = keyMap[e.key] || e.key.toLowerCase();
        
        // Handle special hint keys - map ? to / for US keyboards
        if (key === '?') {
            key = '/';
        }
        
        parts.push(key);
        
        const combo = parts.join('+');
        console.log(`Tutorial: Detected key combo: ${combo} (original key: ${e.key})`);
        return combo;
    }

    async initializeMainApp() {
        try {
            // Hide loading overlay immediately for tutorial
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Don't actually load the main app in tutorial mode
            // Just ensure the UI is ready for interaction
            console.log('Tutorial completed - main app would be loaded here');
        } catch (error) {
            console.error('Tutorial completion note:', error);
        }
    }
}

// Initialize tutorial when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting tutorial...');
    try {
        const tutorial = new DictationTutorial();
        console.log('Tutorial initialized successfully');
        
        // Make tutorial available for debugging
        window.tutorial = tutorial;
    } catch (error) {
        console.error('Failed to initialize tutorial:', error);
        
        // Hide loading overlay even if tutorial fails
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Show error message
        alert('Failed to load tutorial. Please refresh the page.');
    }
});
