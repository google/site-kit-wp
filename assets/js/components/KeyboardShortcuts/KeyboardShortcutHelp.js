/**
 * Keyboard Shortcut Help component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useKeyboardShortcuts } from './KeyboardShortcutProvider';
import { Dialog, DialogTitle, DialogContent } from 'googlesitekit-components';
import useViewContext from '../../hooks/useViewContext';

/**
 * Formats a key combination for display
 * @param {string} keyCombo - The key combination string
 * @return {Array} Array of formatted key parts
 */
function formatKeyCombo( keyCombo ) {
	const parts = keyCombo.split( '+' );
	const isMac = navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;

	return parts.map( ( part ) => {
		switch ( part ) {
			case 'ctrl':
				return isMac ? '⌘' : 'Ctrl';
			case 'shift':
				return isMac ? '⇧' : 'Shift';
			case 'alt':
				return isMac ? '⌥' : 'Alt';
			case 'meta':
				return isMac ? '⌘' : 'Win';
			default:
				return part.toUpperCase();
		}
	} );
}

/**
 * Groups shortcuts by category
 * @param {Object} shortcuts - All shortcuts
 * @param {string} currentContext - Current view context
 * @return {Object} Grouped shortcuts
 */
function groupShortcuts( shortcuts, currentContext ) {
	const groups = {
		global: {
			title: __( 'Global', 'google-site-kit' ),
			shortcuts: [],
		},
		navigation: {
			title: __( 'Navigation', 'google-site-kit' ),
			shortcuts: [],
		},
		contextual: {
			title: __( 'Current Page', 'google-site-kit' ),
			shortcuts: [],
		},
	};

	Object.entries( shortcuts ).forEach( ( [ keyCombo, shortcut ] ) => {
		const shortcutItem = { ...shortcut, keyCombo };

		if ( shortcut.global ) {
			if ( shortcut.action === 'navigate' ) {
				groups.navigation.shortcuts.push( shortcutItem );
			} else {
				groups.global.shortcuts.push( shortcutItem );
			}
		} else if (
			shortcut.context === currentContext ||
			! shortcut.context
		) {
			groups.contextual.shortcuts.push( shortcutItem );
		}
	} );

	// Remove empty groups
	return Object.fromEntries(
		Object.entries( groups ).filter(
			( [ , group ] ) => group.shortcuts.length > 0
		)
	);
}

export default function KeyboardShortcutHelp() {
	const { shortcuts, isHelpVisible, setIsHelpVisible } =
		useKeyboardShortcuts();
	const viewContext = useViewContext();

	// Close help modal on Escape key
	useEffect( () => {
		const handleEscape = ( event ) => {
			if ( event.key === 'Escape' && isHelpVisible ) {
				setIsHelpVisible( false );
			}
		};

		if ( isHelpVisible ) {
			document.addEventListener( 'keydown', handleEscape );
		}

		return () => {
			document.removeEventListener( 'keydown', handleEscape );
		};
	}, [ isHelpVisible, setIsHelpVisible ] );

	if ( ! isHelpVisible ) {
		return null;
	}

	const groupedShortcuts = groupShortcuts( shortcuts, viewContext );

	return (
		<Dialog
			open={ isHelpVisible }
			onClose={ () => setIsHelpVisible( false ) }
			className="googlesitekit-keyboard-shortcuts-modal"
		>
			<DialogTitle>
				{ __( 'Keyboard Shortcuts', 'google-site-kit' ) }
			</DialogTitle>
			<DialogContent>
				<div className="googlesitekit-keyboard-shortcuts-help">
					{ Object.entries( groupedShortcuts ).map(
						( [ groupKey, group ] ) => (
							<div
								key={ groupKey }
								className="googlesitekit-keyboard-shortcuts-group"
							>
								<h3 className="googlesitekit-keyboard-shortcuts-group__title">
									{ group.title }
								</h3>
								<div className="googlesitekit-keyboard-shortcuts-list">
									{ group.shortcuts.map( ( shortcut ) => (
										<div
											key={ shortcut.id }
											className="googlesitekit-keyboard-shortcut-item"
										>
											<div className="googlesitekit-keyboard-shortcut-item__keys">
												{ formatKeyCombo(
													shortcut.keyCombo
												).map(
													( key, index, array ) => (
														<Fragment key={ index }>
															<kbd className="googlesitekit-keyboard-shortcut-key">
																{ key }
															</kbd>
															{ index <
																array.length -
																	1 && (
																<span className="googlesitekit-keyboard-shortcut-separator">
																	+
																</span>
															) }
														</Fragment>
													)
												) }
											</div>
											<div className="googlesitekit-keyboard-shortcut-item__description">
												{ shortcut.description }
											</div>
										</div>
									) ) }
								</div>
							</div>
						)
					) }

					<div className="googlesitekit-keyboard-shortcuts-footer">
						<p className="googlesitekit-keyboard-shortcuts-note">
							{ __(
								'Press Escape to close this help.',
								'google-site-kit'
							) }
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
