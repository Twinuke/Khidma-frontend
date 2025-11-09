/**
 * Post-install script to add Appearance polyfill to react-native-web
 * This fixes the missing Appearance export for Expo web support
 */

const fs = require('fs');
const path = require('path');

const appearanceDir = path.join(__dirname, '..', 'node_modules', 'react-native-web', 'dist', 'exports', 'Appearance');
const appearanceFile = path.join(appearanceDir, 'index.js');
const mainIndexFile = path.join(__dirname, '..', 'node_modules', 'react-native-web', 'dist', 'index.js');

// Create Appearance directory if it doesn't exist
if (!fs.existsSync(appearanceDir)) {
  fs.mkdirSync(appearanceDir, { recursive: true });
}

// Create Appearance polyfill file
const appearancePolyfill = `/**
 * Appearance API polyfill for react-native-web
 * This provides a basic implementation of the Appearance API for web
 */

const Appearance = {
  /**
   * Get the current color scheme preference
   * @returns {'light' | 'dark' | null}
   */
  getColorScheme() {
    if (typeof window === 'undefined') {
      return 'light';
    }

    // Check for prefers-color-scheme media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  },

  /**
   * Add a change listener
   * @param {Function} listener
   * @returns {Object} Subscription object with remove method
   */
  addChangeListener(listener) {
    if (typeof window === 'undefined') {
      return { remove: () => {} };
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      listener({ colorScheme: e.matches ? 'dark' : 'light' });
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return {
        remove: () => {
          mediaQuery.removeEventListener('change', handler);
        },
      };
    }

    // Legacy browsers
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return {
        remove: () => {
          mediaQuery.removeListener(handler);
        },
      };
    }

    return { remove: () => {} };
  },

  /**
   * Remove a change listener
   * @param {Object} subscription
   */
  removeChangeListener(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
  },
};

export default Appearance;
`;

// Write Appearance polyfill
fs.writeFileSync(appearanceFile, appearancePolyfill, 'utf8');

// Update main index.js if Appearance is not already imported
if (fs.existsSync(mainIndexFile)) {
  let mainIndexContent = fs.readFileSync(mainIndexFile, 'utf8');
  
  // Only update if Appearance is not already imported
  if (!mainIndexContent.includes("import Appearance from './exports/Appearance'")) {
    // Add import after Animated
    mainIndexContent = mainIndexContent.replace(
      "import Animated from './exports/Animated';\nimport AppRegistry",
      "import Animated from './exports/Animated';\nimport Appearance from './exports/Appearance';\nimport AppRegistry"
    );
    
    // Add to exports
    mainIndexContent = mainIndexContent.replace(
      'AccessibilityInfo, Alert, Animated, AppRegistry',
      'AccessibilityInfo, Alert, Animated, Appearance, AppRegistry'
    );
    
    // Add to ReactNative object
    mainIndexContent = mainIndexContent.replace(
      '  Animated: Animated,\n  AppRegistry: AppRegistry',
      '  Animated: Animated,\n  Appearance: Appearance,\n  AppRegistry: AppRegistry'
    );
    
    fs.writeFileSync(mainIndexFile, mainIndexContent, 'utf8');
    console.log('✓ Added Appearance polyfill to react-native-web');
  } else {
    console.log('✓ Appearance polyfill already exists');
  }
} else {
  console.warn('⚠ Could not find react-native-web/dist/index.js');
}

