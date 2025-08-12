/**
 * Keyboard Shortcut Provider component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import useViewContext from '../../hooks/useViewContext';

const KeyboardShortcutContext = createContext();

/**
 * Default keyboard shortcuts configuration
 */
const DEFAULT_SHORTCUTS = {
	// Global shortcuts
	'ctrl+shift+g': {
		id: 'goto-dashboard',
		description: 'Go to Dashboard',
		action: 'navigate',
		target: 'dashboard',
		global: true,
	},
	'ctrl+shift+s': {
		id: 'goto-settings',
		description: 'Go to Settings',
		action: 'navigate',
		target: 'settings',
		global: true,
	},
	'ctrl+shift+?': {
		id: 'show-shortcuts',
		description: 'Show keyboard shortcuts',
		action: 'toggle-help',
		global: true,
	},
	'ctrl+shift+/': {
		id: 'show-shortcuts-alt',
		description: 'Show keyboard shortcuts',
		action: 'toggle-help',
		global: true,
	},
	'ctrl+/': {
		id: 'show-shortcuts-simple',
		description: 'Show keyboard shortcuts',
		action: 'toggle-help',
		global: true,
	},
	'ctrl+k': {
		id: 'open-command-palette',
		description: 'Open command palette',
		action: 'open-command-palette',
		global: true,
	},
	// Settings page shortcuts
	'ctrl+1': {
		id: 'settings-connected',
		description: 'Connected Services tab',
		action: 'navigate',
		target: '/connected-services',
		context: 'settings',
	},
	'ctrl+2': {
		id: 'settings-connect-more',
		description: 'Connect More Services tab',
		action: 'navigate',
		target: '/connect-more-services',
		context: 'settings',
	},
	'ctrl+3': {
		id: 'settings-admin',
		description: 'Admin Settings tab',
		action: 'navigate',
		target: '/admin-settings',
		context: 'settings',
	},
	// Dashboard navigation shortcuts
	k: {
		id: 'goto-key-metrics',
		description: 'Key Metrics section',
		action: 'scroll-to',
		target: 'googlesitekit-key-metrics',
		context: 'dashboard',
	},
	t: {
		id: 'goto-traffic',
		description: 'Traffic section',
		action: 'scroll-to',
		target: 'googlesitekit-traffic',
		context: 'dashboard',
	},
	c: {
		id: 'goto-content',
		description: 'Content section',
		action: 'scroll-to',
		target: 'googlesitekit-content',
		context: 'dashboard',
	},
	s: {
		id: 'goto-speed',
		description: 'Speed section',
		action: 'scroll-to',
		target: 'googlesitekit-speed',
		context: 'dashboard',
	},
	m: {
		id: 'goto-monetization',
		description: 'Monetization section',
		action: 'scroll-to',
		target: 'googlesitekit-monetization',
		context: 'dashboard',
	},
	// Module shortcuts
	'ctrl+shift+a': {
		id: 'goto-analytics',
		description: 'Analytics settings',
		action: 'navigate',
		target: 'settings#/connected-services/analytics-4',
		global: true,
	},
	'ctrl+shift+c': {
		id: 'goto-search-console',
		description: 'Search Console settings',
		action: 'navigate',
		target: 'settings#/connected-services/search-console',
		global: true,
	},
	'ctrl+shift+e': {
		id: 'goto-adsense',
		description: 'AdSense settings',
		action: 'navigate',
		target: 'settings#/connected-services/adsense',
		global: true,
	},
	'ctrl+shift+t': {
		id: 'goto-tagmanager',
		description: 'Tag Manager settings',
		action: 'navigate',
		target: 'settings#/connected-services/tagmanager',
		global: true,
	},
	'ctrl+shift+p': {
		id: 'goto-pagespeed',
		description: 'PageSpeed Insights settings',
		action: 'navigate',
		target: 'settings#/connected-services/pagespeed-insights',
		global: true,
	},
};

/**
 * Normalizes a key combination for consistent matching
 * @param {KeyboardEvent} event - The keyboard event
 * @return {string} Normalized key combination
 */
function normalizeKeyCombo( event ) {
	const keys = [];

	if ( event.ctrlKey || event.metaKey ) {
		keys.push( 'ctrl' );
	}
	if ( event.shiftKey ) {
		keys.push( 'shift' );
	}
	if ( event.altKey ) {
		keys.push( 'alt' );
	}

	// Add the main key (converted to lowercase)
	const mainKey = event.key.toLowerCase();
	if (
		mainKey !== 'control' &&
		mainKey !== 'shift' &&
		mainKey !== 'alt' &&
		mainKey !== 'meta'
	) {
		keys.push( mainKey );
	}

	return keys.join( '+' );
}

/**
 * Checks if the event should be ignored (e.g., when typing in input fields)
 * @param {KeyboardEvent} event - The keyboard event
 * @return {boolean} Whether to ignore the event
 */
function shouldIgnoreEvent( event ) {
	const target = event.target;
	const tagName = target.tagName.toLowerCase();
	const isContentEditable = target.contentEditable === 'true';

	// Ignore events in input fields, textareas, and contenteditable elements
	return tagName === 'input' || tagName === 'textarea' || isContentEditable;
}

export default function KeyboardShortcutProvider( { children } ) {
	const [ shortcuts ] = useState( DEFAULT_SHORTCUTS );
	const [ isHelpVisible, setIsHelpVisible ] = useState( false );

	const viewContext = useViewContext();
	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);

	/**
	 * Handles navigation actions
	 */
	const handleNavigation = useCallback(
		( target ) => {
			if ( target.startsWith( '/' ) ) {
				// Handle hash-based navigation for React Router
				global.location.hash = target;
			} else if ( target.includes( '#' ) ) {
				// Handle navigation with hash (e.g., "settings#/connected-services/analytics-4")
				const [ page, hash ] = target.split( '#' );
				const url = `${ adminURL }admin.php?page=googlesitekit-${ page }#${ hash }`;
				global.location.href = url;
			} else {
				// Handle full page navigation
				const url = `${ adminURL }admin.php?page=googlesitekit-${ target }`;
				global.location.href = url;
			}
		},
		[ adminURL ]
	);

	/**
	 * Handles scroll-to-section actions
	 */
	const handleScrollTo = useCallback( ( target ) => {
		const element = document.getElementById( target );
		if ( element ) {
			element.scrollIntoView( {
				behavior: 'smooth',
				block: 'start',
			} );
		}
	}, [] );

	/**
	 * Executes a shortcut action
	 */
	const executeShortcut = useCallback(
		( shortcut ) => {
			switch ( shortcut.action ) {
				case 'navigate':
					handleNavigation( shortcut.target );
					break;
				case 'scroll-to':
					handleScrollTo( shortcut.target );
					break;
				case 'toggle-help':
					setIsHelpVisible( ( prev ) => ! prev );
					break;
				case 'open-command-palette':
					if ( global.openCommandPalette ) {
						global.openCommandPalette();
					}
					break;
				default:
					break;
			}
		},
		[ handleNavigation, handleScrollTo ]
	);

	/**
	 * Handles keyboard events
	 */
	const handleKeyDown = useCallback(
		( event ) => {
			// Ignore events in input fields
			if ( shouldIgnoreEvent( event ) ) {
				return;
			}

			const keyCombo = normalizeKeyCombo( event );

			// Debug logging for Shift key combinations
			if ( ( event.ctrlKey || event.metaKey ) && event.shiftKey ) {
				console.log( 'Debug - Key pressed:', {
					key: event.key,
					code: event.code,
					keyCombo,
					ctrlKey: event.ctrlKey,
					metaKey: event.metaKey,
					shiftKey: event.shiftKey,
					availableShortcuts: Object.keys( shortcuts ),
				} );
			}

			const shortcut = shortcuts[ keyCombo ];

			if ( ! shortcut ) {
				return;
			}

			// Check if shortcut is global or matches current context
			const isApplicable =
				shortcut.global ||
				shortcut.context === viewContext ||
				! shortcut.context;

			if ( ! isApplicable ) {
				return;
			}

			// Prevent default browser behavior
			event.preventDefault();
			event.stopPropagation();

			// Execute the shortcut
			executeShortcut( shortcut );
		},
		[ shortcuts, viewContext, executeShortcut ]
	);

	// Set up global keyboard event listener
	useEffect( () => {
		document.addEventListener( 'keydown', handleKeyDown );

		return () => {
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ handleKeyDown ] );

	const contextValue = {
		shortcuts,
		isHelpVisible,
		setIsHelpVisible,
		executeShortcut,
	};

	return (
		<KeyboardShortcutContext.Provider value={ contextValue }>
			{ children }
		</KeyboardShortcutContext.Provider>
	);
}

KeyboardShortcutProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

/**
 * Hook to access keyboard shortcut context
 */
export function useKeyboardShortcuts() {
	const context = useContext( KeyboardShortcutContext );

	if ( ! context ) {
		throw new Error(
			'useKeyboardShortcuts must be used within a KeyboardShortcutProvider'
		);
	}

	return context;
}
