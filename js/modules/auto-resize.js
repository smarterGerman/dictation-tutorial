/**
 * Auto-resize module for iframe integration
 */
import { CONFIG } from '../config.js';
import { TimeHelpers } from '../utils/time-helpers.js';

export class AutoResize {
    constructor() {
        this.lastReportedHeight = 0;
        this.resizeTimeout = null;
        this.observer = null;
        this.initialized = false;
        
        // Throttled height sender
        this.sendHeightThrottled = TimeHelpers.throttle(
            this.sendHeightToParent.bind(this), 
            CONFIG.heightReportThrottle
        );
    }
    
    /**
     * Initialize auto-resize system
     */
    initialize() {
        if (this.initialized) {
            console.warn('AutoResize already initialized');
            return;
        }
        
        if (this.setupResizeObserver()) {
        } else {
            this.setupFallbackObserver();
        }
        
        // Initial height calculation
        this.sendHeightToParent();
        this.initialized = true;
    }
    
    /**
     * Setup modern ResizeObserver
     */
    setupResizeObserver() {
        if (!window.ResizeObserver) {
            return false;
        }
        
        this.observer = new ResizeObserver(entries => {
            this.sendHeightThrottled();
        });
        
        // Observe the main container for size changes
        const container = document.querySelector('.container');
        if (container) {
            this.observer.observe(container);
        }
        
        // Also observe document body for additional safety
        this.observer.observe(document.body);
        
        return true;
    }
    
    /**
     * Setup fallback observer for older browsers
     */
    setupFallbackObserver() {
        // Method 2: Fallback for older browsers
        const mutationObserver = new MutationObserver(() => {
            this.sendHeightThrottled();
        });
        
        // Watch for DOM changes that could affect height
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'], // Only watch relevant attributes
        });
        
        // Additional fallback: Window resize events
        window.addEventListener('resize', this.sendHeightThrottled);
        
        // Backup polling for edge cases (very conservative)
        setInterval(() => {
            this.sendHeightToParent();
        }, CONFIG.backupPollingInterval);
        
        this.observer = mutationObserver;
    }
    
    sendHeightToParent() {
    // COMPLETE BLOCK: Don't resize iframe when dictation tutorial is present
    const tutorialElement = document.querySelector('.dictation-tutorial');
    if (tutorialElement) {
        console.log('Tutorial detected - skipping iframe resize');
        return; // Skip ALL resize operations during tutorial
    }
    
    // Clear any pending resize calls
    if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
    }
    
    // Use a small delay to ensure DOM is fully updated
    this.resizeTimeout = setTimeout(() => {
        const height = this.calculateHeight();
        
        // Only send if height actually changed (prevent spam)
        if (height !== this.lastReportedHeight) {
            this.lastReportedHeight = height;
            
            // Send message to parent frame
            if (window.parent && window.parent !== window) {
                try {
                    window.parent.postMessage({
                        type: 'resize',
                        height: height
                    }, '*');
                } catch (error) {
                    console.debug('Could not send height to parent:', error);
                }
            }
        }
    }, CONFIG.autoResizeDelay);
}
    
    /**
 * Calculate current document height - with tutorial-aware logic
 */
calculateHeight() {
    // Check if tutorial is active
    const tutorialOverlay = document.querySelector('.dictation-tutorial');
    const isActiveTutorial = tutorialOverlay && tutorialOverlay.style.display !== 'none' && 
                            window.activeTutorial && window.activeTutorial.isActive;
    
    if (isActiveTutorial) {
        // For tutorial mode: calculate based on actual visible content
        const container = document.querySelector('.container');
        const tutorialContainer = document.querySelector('.dictation-tutorial');
        
        if (container && tutorialContainer) {
            // Get the main app container height
            const containerRect = container.getBoundingClientRect();
            const tutorialRect = tutorialContainer.getBoundingClientRect();
            
            // Calculate needed height: container height + tutorial height + some padding
            const neededHeight = Math.max(
                containerRect.bottom,
                tutorialRect.bottom
            ) + 40; // Add some padding
            
            return Math.min(neededHeight, window.innerHeight * 0.9); // Max 90% of viewport
        }
    }
    
    // Original calculation for non-tutorial mode
    return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
}
    
    /**
     * Manually trigger height recalculation
     */
    triggerResize() {
        this.sendHeightToParent();
    }
    
    /**
     * Cleanup observers
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        this.initialized = false;
    }
    
    /**
     * Static method for easy access
     */
    static create() {
        return new AutoResize();
    }
}
