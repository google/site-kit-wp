/**
 * Command Palette Provider component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
} from '@wordpress/element';

const CommandPaletteContext = createContext();

/**
 * Checks if the event should be ignored (e.g., when typing in input fields).
 *
 * @since n.e.x.t
 *
 * @param {KeyboardEvent} event The keyboard event.
 * @return {boolean} Whether to ignore the event.
 */
function shouldIgnoreEvent( event ) {
	const target = event.target;
	const tagName = target.tagName.toLowerCase();
	const isContentEditable = target.contentEditable === 'true';

	// Ignore events in input fields, textareas, and contenteditable elements
	return tagName === 'input' || tagName === 'textarea' || isContentEditable;
}

/**
 * Provides command palette functionality.
 *
 * @since n.e.x.t
 *
 * @param {Object}    props          Component props.
 * @param {WPElement} props.children Child components.
 * @return {WPElement} The component.
 */
export default function CommandPaletteProvider( { children } ) {
	/**
	 * Handles keyboard events for command palette.
	 */
	const handleKeyDown = useCallback( ( event ) => {
		// Ignore events in input fields
		if ( shouldIgnoreEvent( event ) ) {
			return;
		}

		// Check for Ctrl/Cmd + K to open command palette
		if ( ( event.ctrlKey || event.metaKey ) && event.key === 'k' ) {
			event.preventDefault();
			event.stopPropagation();

			if ( global.openCommandPalette ) {
				global.openCommandPalette();
			}
		}
	}, [] );

	// Set up global keyboard event listener
	useEffect( () => {
		document.addEventListener( 'keydown', handleKeyDown );

		return () => {
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ handleKeyDown ] );

	const contextValue = {};

	return (
		<CommandPaletteContext.Provider value={ contextValue }>
			{ children }
		</CommandPaletteContext.Provider>
	);
}

CommandPaletteProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

/**
 * Returns command palette context.
 *
 * @since n.e.x.t
 *
 * @return {Object} Command palette context.
 */
export function useCommandPalette() {
	const context = useContext( CommandPaletteContext );

	if ( ! context ) {
		throw new Error(
			'useCommandPalette must be used within a CommandPaletteProvider'
		);
	}

	return context;
}
