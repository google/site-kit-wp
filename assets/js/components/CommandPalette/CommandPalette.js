/**
 * Command Palette component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState, useRef } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { Dialog, DialogContent } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

/**
 * Performs enhanced fuzzy search with typo tolerance.
 *
 * @since n.e.x.t
 *
 * @param {string} query     The search query.
 * @param {string} target    The target string to match against.
 * @param {number} threshold The similarity threshold (0-1).
 * @return {boolean} Whether the target matches the query.
 */
function fuzzyMatch( query, target, threshold = 0.6 ) {
	if ( ! query || ! target ) {
		return false;
	}

	const queryLower = query.toLowerCase().trim();
	const targetLower = target.toLowerCase();

	// Exact match
	if ( targetLower.includes( queryLower ) ) {
		return true;
	}

	// Calculate similarity using Levenshtein distance
	const distance = levenshteinDistance( queryLower, targetLower );
	const maxLength = Math.max( queryLower.length, targetLower.length );
	const similarity = 1 - distance / maxLength;

	return similarity >= threshold;
}

/**
 * Calculates Levenshtein distance between two strings.
 *
 * @since n.e.x.t
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @return {number} The Levenshtein distance.
 */
function levenshteinDistance( a, b ) {
	const matrix = [];

	for ( let i = 0; i <= b.length; i++ ) {
		matrix[ i ] = [ i ];
	}

	for ( let j = 0; j <= a.length; j++ ) {
		matrix[ 0 ][ j ] = j;
	}

	for ( let i = 1; i <= b.length; i++ ) {
		for ( let j = 1; j <= a.length; j++ ) {
			if ( b.charAt( i - 1 ) === a.charAt( j - 1 ) ) {
				matrix[ i ][ j ] = matrix[ i - 1 ][ j - 1 ];
			} else {
				matrix[ i ][ j ] = Math.min(
					matrix[ i - 1 ][ j - 1 ] + 1, // substitution
					matrix[ i ][ j - 1 ] + 1, // insertion
					matrix[ i - 1 ][ j ] + 1 // deletion
				);
			}
		}
	}

	return matrix[ b.length ][ a.length ];
}

/**
 * Available commands/pages for navigation.
 */
const COMMANDS = [
	// Quick Actions
	{
		id: 'flush-permalinks',
		title: __( 'Flush Permalinks', 'google-site-kit' ),
		description: __( 'Refresh permalink structure', 'google-site-kit' ),
		action: 'wp-action',
		target: 'flush_permalinks',
		keywords: [ 'refresh', 'urls', 'links', 'structure' ],
		category: 'Quick Actions',
		icon: '🔄',
	},
	{
		id: 'wp-commands',
		title: __( 'WordPress Commands', 'google-site-kit' ),
		description: __(
			'Access WordPress native command palette',
			'google-site-kit'
		),
		action: 'wp-commands',
		target: 'open',
		keywords: [ 'wp', 'native', 'core', 'commands' ],
		category: 'Quick Actions',
		icon: '⚡',
	},
	// Main pages
	{
		id: 'dashboard',
		title: __( 'Dashboard', 'google-site-kit' ),
		description: __(
			'View your site performance overview',
			'google-site-kit'
		),
		action: 'navigate',
		target: 'dashboard',
		keywords: [ 'dashboard', 'home', 'overview', 'main' ],
		category: 'Pages',
	},
	{
		id: 'settings',
		title: __( 'Settings', 'google-site-kit' ),
		description: __( 'Configure Site Kit settings', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings',
		keywords: [ 'settings', 'configuration', 'setup' ],
		category: 'Pages',
	},

	// Settings tabs
	{
		id: 'connected-services',
		title: __( 'Connected Services', 'google-site-kit' ),
		description: __(
			'Manage connected Google services',
			'google-site-kit'
		),
		action: 'navigate',
		target: 'settings#/connected-services',
		keywords: [ 'connected', 'services', 'modules', 'google' ],
		category: 'Settings',
	},
	{
		id: 'connect-more-services',
		title: __( 'Connect More Services', 'google-site-kit' ),
		description: __(
			'Connect additional Google services',
			'google-site-kit'
		),
		action: 'navigate',
		target: 'settings#/connect-more-services',
		keywords: [ 'connect', 'more', 'services', 'add', 'new' ],
		category: 'Settings',
	},
	{
		id: 'admin-settings',
		title: __( 'Admin Settings', 'google-site-kit' ),
		description: __( 'Advanced admin configuration', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/admin-settings',
		keywords: [ 'admin', 'advanced', 'configuration' ],
		category: 'Settings',
	},

	// Module settings
	{
		id: 'analytics-settings',
		title: __( 'Analytics Settings', 'google-site-kit' ),
		description: __( 'Configure Google Analytics', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/connected-services/analytics-4',
		keywords: [ 'analytics', 'ga4', 'google analytics', 'tracking' ],
		category: 'Modules',
	},
	{
		id: 'search-console-settings',
		title: __( 'Search Console Settings', 'google-site-kit' ),
		description: __( 'Configure Google Search Console', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/connected-services/search-console',
		keywords: [ 'search console', 'gsc', 'search', 'seo' ],
		category: 'Modules',
	},
	{
		id: 'adsense-settings',
		title: __( 'AdSense Settings', 'google-site-kit' ),
		description: __( 'Configure Google AdSense', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/connected-services/adsense',
		keywords: [ 'adsense', 'ads', 'monetization', 'revenue' ],
		category: 'Modules',
	},
	{
		id: 'tag-manager-settings',
		title: __( 'Tag Manager Settings', 'google-site-kit' ),
		description: __( 'Configure Google Tag Manager', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/connected-services/tagmanager',
		keywords: [ 'tag manager', 'gtm', 'tags', 'tracking' ],
		category: 'Modules',
	},
	{
		id: 'pagespeed-settings',
		title: __( 'PageSpeed Insights Settings', 'google-site-kit' ),
		description: __( 'Configure PageSpeed Insights', 'google-site-kit' ),
		action: 'navigate',
		target: 'settings#/connected-services/pagespeed-insights',
		keywords: [ 'pagespeed', 'speed', 'performance', 'lighthouse' ],
		category: 'Modules',
	},

	// Dashboard sections
	{
		id: 'key-metrics',
		title: __( 'Key Metrics', 'google-site-kit' ),
		description: __(
			'View your most important metrics',
			'google-site-kit'
		),
		action: 'scroll-to',
		target: 'googlesitekit-key-metrics',
		keywords: [ 'key metrics', 'metrics', 'overview', 'kpi' ],
		category: 'Dashboard Sections',
	},
	{
		id: 'traffic-section',
		title: __( 'Traffic', 'google-site-kit' ),
		description: __( 'View traffic data and analytics', 'google-site-kit' ),
		action: 'scroll-to',
		target: 'googlesitekit-traffic',
		keywords: [ 'traffic', 'visitors', 'sessions', 'users' ],
		category: 'Dashboard Sections',
	},
	{
		id: 'content-section',
		title: __( 'Content', 'google-site-kit' ),
		description: __( 'View content performance data', 'google-site-kit' ),
		action: 'scroll-to',
		target: 'googlesitekit-content',
		keywords: [ 'content', 'pages', 'posts', 'popular' ],
		category: 'Dashboard Sections',
	},
	{
		id: 'speed-section',
		title: __( 'Speed', 'google-site-kit' ),
		description: __( 'View site speed and performance', 'google-site-kit' ),
		action: 'scroll-to',
		target: 'googlesitekit-speed',
		keywords: [ 'speed', 'performance', 'pagespeed', 'core web vitals' ],
		category: 'Dashboard Sections',
	},
	{
		id: 'monetization-section',
		title: __( 'Monetization', 'google-site-kit' ),
		description: __(
			'View revenue and monetization data',
			'google-site-kit'
		),
		action: 'scroll-to',
		target: 'googlesitekit-monetization',
		keywords: [ 'monetization', 'revenue', 'earnings', 'adsense' ],
		category: 'Dashboard Sections',
	},
];

/**
 * Filters commands based on search query.
 *
 * @since n.e.x.t
 *
 * @param {string} query The search query to filter by.
 * @return {Array} Filtered array of commands.
 */
function filterCommands( query ) {
	if ( ! query.trim() ) {
		return COMMANDS;
	}

	const searchTerm = query.toLowerCase().trim();

	return COMMANDS.filter( ( command ) => {
		// Exact matches first (higher priority)
		if ( command.title.toLowerCase().includes( searchTerm ) ) {
			return true;
		}

		if ( command.description.toLowerCase().includes( searchTerm ) ) {
			return true;
		}

		// Exact keyword matches
		if (
			command.keywords.some( ( keyword ) =>
				keyword.toLowerCase().includes( searchTerm )
			)
		) {
			return true;
		}

		// Fuzzy matches for typo tolerance
		if ( fuzzyMatch( searchTerm, command.title ) ) {
			return true;
		}

		if ( fuzzyMatch( searchTerm, command.description ) ) {
			return true;
		}

		// Fuzzy keyword matches
		return command.keywords.some( ( keyword ) =>
			fuzzyMatch( searchTerm, keyword )
		);
	} );
}

/**
 * Groups commands by category.
 *
 * @since n.e.x.t
 *
 * @param {Array} commands The array of commands to group.
 * @return {Object} Commands grouped by category.
 */
function groupCommands( commands ) {
	const groups = {};

	commands.forEach( ( command ) => {
		if ( ! groups[ command.category ] ) {
			groups[ command.category ] = [];
		}
		groups[ command.category ].push( command );
	} );

	return groups;
}

/**
 * Command Palette component for quick navigation.
 *
 * @since n.e.x.t
 *
 * @return {WPElement} The component.
 */
export default function CommandPalette() {
	const [ query, setQuery ] = useState( '' );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ isVisible, setIsVisible ] = useState( false );
	const inputRef = useRef( null );

	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);

	const filteredCommands = filterCommands( query );
	const groupedCommands = groupCommands( filteredCommands );

	// Flatten commands for keyboard navigation
	const flatCommands = Object.values( groupedCommands ).flat();

	/**
	 * Handles navigation actions.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} target The navigation target.
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
	 * Handles scroll-to-section actions.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} target The element ID to scroll to.
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
	 * Executes the selected command.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} command The command to execute.
	 */
	/**
	 * Handles WordPress actions.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} action The WordPress action to execute.
	 */
	const handleWpAction = useCallback( ( action ) => {
		switch ( action ) {
			case 'flush_permalinks':
				// Trigger WordPress permalink flush
				doAction( 'sitekit.flushPermalinks' );
				// Show notification
				global.console?.log( 'Permalinks flushed successfully!' );
				break;
			default:
				break;
		}
	}, [] );

	/**
	 * Handles WordPress native commands.
	 *
	 * @since n.e.x.t
	 */
	const handleWpCommands = useCallback( () => {
		// Try to open WordPress native command palette if available
		if ( global.wp?.commands?.open ) {
			global.wp.commands.open();
		} else if (
			document.querySelector( '[data-command="core/command-palette"]' )
		) {
			// Fallback: simulate Cmd/Ctrl + K for WP command palette
			const event = new KeyboardEvent( 'keydown', {
				key: 'k',
				ctrlKey: true,
				metaKey: true,
				bubbles: true,
			} );
			document.dispatchEvent( event );
		} else {
			// Show message if not available
			global.console?.log(
				'WordPress command palette not available in this version.'
			);
		}
	}, [] );

	const executeCommand = useCallback(
		( command ) => {
			switch ( command.action ) {
				case 'navigate':
					handleNavigation( command.target );
					break;
				case 'scroll-to':
					handleScrollTo( command.target );
					break;
				case 'wp-action':
					handleWpAction( command.target );
					break;
				case 'wp-commands':
					handleWpCommands();
					break;
				case 'clear-cache':
					// Hook for cache plugins to implement
					doAction( 'sitekit.clearCache', command.target );
					global.console?.log( 'Cache clear requested!' );
					break;
				default:
					break;
			}

			setIsVisible( false );
			setQuery( '' );
			setSelectedIndex( 0 );
		},
		[ handleNavigation, handleScrollTo, handleWpAction, handleWpCommands ]
	);

	/**
	 * Handles keyboard navigation.
	 *
	 * @since n.e.x.t
	 */
	const handleKeyDown = useCallback(
		( event ) => {
			switch ( event.key ) {
				case 'ArrowDown':
					event.preventDefault();
					setSelectedIndex( ( prev ) =>
						prev < flatCommands.length - 1 ? prev + 1 : 0
					);
					break;
				case 'ArrowUp':
					event.preventDefault();
					setSelectedIndex( ( prev ) =>
						prev > 0 ? prev - 1 : flatCommands.length - 1
					);
					break;
				case 'Enter':
					event.preventDefault();
					if ( flatCommands[ selectedIndex ] ) {
						executeCommand( flatCommands[ selectedIndex ] );
					}
					break;
				case 'Escape':
					event.preventDefault();
					setIsVisible( false );
					setQuery( '' );
					setSelectedIndex( 0 );
					break;
			}
		},
		[ flatCommands, selectedIndex, executeCommand ]
	);

	/**
	 * Handles search input changes.
	 *
	 * @since n.e.x.t
	 */
	const handleInputChange = useCallback( ( event ) => {
		setQuery( event.target.value );
		setSelectedIndex( 0 ); // Reset selection when search changes
	}, [] );

	/**
	 * Handles command clicks.
	 *
	 * @since n.e.x.t
	 */
	const handleCommandClick = useCallback(
		( command ) => {
			executeCommand( command );
		},
		[ executeCommand ]
	);

	// Focus input when modal opens
	useEffect( () => {
		if ( isVisible && inputRef.current ) {
			inputRef.current.focus();
		}
	}, [ isVisible ] );

	// Reset selection when filtered commands change
	useEffect( () => {
		if ( selectedIndex >= flatCommands.length ) {
			setSelectedIndex( 0 );
		}
	}, [ flatCommands.length, selectedIndex ] );

	// Expose methods to parent components
	useEffect( () => {
		// Add a global function to open the command palette
		global.openCommandPalette = () => {
			setIsVisible( true );
		};

		return () => {
			delete global.openCommandPalette;
		};
	}, [] );

	if ( ! isVisible ) {
		return null;
	}

	let commandIndex = 0;

	return (
		<Dialog
			open={ isVisible }
			onClose={ () => setIsVisible( false ) }
			className="googlesitekit-command-palette"
		>
			<DialogContent className="googlesitekit-command-palette__dialog">
				<div className="googlesitekit-command-palette__container">
					<div className="googlesitekit-command-palette__header">
						<div className="googlesitekit-command-palette__search-wrapper">
							<input
								ref={ inputRef }
								type="text"
								value={ query }
								onChange={ handleInputChange }
								onKeyDown={ handleKeyDown }
								placeholder={ __(
									'Search for pages, settings, or actions…',
									'google-site-kit'
								) }
								className="googlesitekit-command-palette__input"
							/>
							{ query && (
								<button
									type="button"
									className="googlesitekit-command-palette__clear"
									onClick={ () => {
										setQuery( '' );
										setSelectedIndex( 0 );
									} }
									aria-label={ __(
										'Clear search',
										'google-site-kit'
									) }
								>
									×
								</button>
							) }
						</div>
					</div>

					<div className="googlesitekit-command-palette__results">
						{ flatCommands.length === 0 ? (
							<div className="googlesitekit-command-palette__no-results">
								<div className="googlesitekit-command-palette__no-results-icon">
									{ query.trim() ? '🔍' : '⌨️' }
								</div>
								<div className="googlesitekit-command-palette__no-results-text">
									{ query.trim()
										? __(
												'No results found',
												'google-site-kit'
										  )
										: __(
												'Type to search for pages, settings, or actions…',
												'google-site-kit'
										  ) }
								</div>
								{ query.trim() && (
									<div className="googlesitekit-command-palette__no-results-hint">
										Try a different search term or browse
										categories below
									</div>
								) }
							</div>
						) : (
							Object.entries( groupedCommands ).map(
								( [ category, commands ] ) => (
									<div
										key={ category }
										className="googlesitekit-command-palette__group"
									>
										<div className="googlesitekit-command-palette__group-header">
											<div className="googlesitekit-command-palette__group-title">
												{ category }
											</div>
											<div className="googlesitekit-command-palette__group-count">
												{ commands.length }
											</div>
										</div>
										<div className="googlesitekit-command-palette__group-commands">
											{ commands.map( ( command ) => {
												const isSelected =
													commandIndex ===
													selectedIndex;
												const currentIndex =
													commandIndex++;

												return (
													<button
														key={ command.id }
														type="button"
														className={ classnames(
															'googlesitekit-command-palette__command',
															{
																'googlesitekit-command-palette__command--selected':
																	isSelected,
															}
														) }
														onClick={ () =>
															handleCommandClick(
																command
															)
														}
														onMouseEnter={ () =>
															setSelectedIndex(
																currentIndex
															)
														}
													>
														<div className="googlesitekit-command-palette__command-content">
															<div className="googlesitekit-command-palette__command-main">
																<div className="googlesitekit-command-palette__command-icon">
																	{ command.icon ||
																		'⚡' }
																</div>
																<div className="googlesitekit-command-palette__command-text">
																	<div className="googlesitekit-command-palette__command-title">
																		{
																			command.title
																		}
																	</div>
																	<div className="googlesitekit-command-palette__command-description">
																		{
																			command.description
																		}
																	</div>
																</div>
															</div>
															<div className="googlesitekit-command-palette__command-meta">
																<div className="googlesitekit-command-palette__command-category">
																	{
																		command.category
																	}
																</div>
																{ isSelected && (
																	<div className="googlesitekit-command-palette__command-shortcut">
																		↵
																	</div>
																) }
															</div>
														</div>
													</button>
												);
											} ) }
										</div>
									</div>
								)
							)
						) }
					</div>

					<div className="googlesitekit-command-palette__footer">
						<div className="googlesitekit-command-palette__hint">
							<div className="googlesitekit-command-palette__shortcuts">
								<kbd className="googlesitekit-command-palette__kbd">
									↑
								</kbd>
								<kbd className="googlesitekit-command-palette__kbd">
									↓
								</kbd>
								<span>to navigate</span>
							</div>
							<div className="googlesitekit-command-palette__shortcuts">
								<kbd className="googlesitekit-command-palette__kbd">
									↵
								</kbd>
								<span>to select</span>
							</div>
							<div className="googlesitekit-command-palette__shortcuts">
								<kbd className="googlesitekit-command-palette__kbd">
									esc
								</kbd>
								<span>to close</span>
							</div>
						</div>
						<div className="googlesitekit-command-palette__branding">
							<span>Site Kit Command Palette</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Registers Site Kit commands with WordPress Command Palette API.
 *
 * @since n.e.x.t
 */
function registerSiteKitCommands() {
	// Check if WordPress Command Palette API is available
	if ( ! global.wp?.commands?.registerCommand ) {
		return;
	}

	// Register key Site Kit commands with WordPress
	const wpCommands = [
		{
			name: 'sitekit/dashboard',
			label: __( 'Site Kit Dashboard', 'google-site-kit' ),
			callback: () => {
				global.location.href = `${
					global.googlesitekit?.admin?.adminURL || '/wp-admin/'
				}admin.php?page=googlesitekit-dashboard`;
			},
		},
		{
			name: 'sitekit/settings',
			label: __( 'Site Kit Settings', 'google-site-kit' ),
			callback: () => {
				global.location.href = `${
					global.googlesitekit?.admin?.adminURL || '/wp-admin/'
				}admin.php?page=googlesitekit-settings`;
			},
		},
		{
			name: 'sitekit/analytics',
			label: __( 'Analytics Settings', 'google-site-kit' ),
			callback: () => {
				global.location.href = `${
					global.googlesitekit?.admin?.adminURL || '/wp-admin/'
				}admin.php?page=googlesitekit-settings#/connected-services/analytics-4`;
			},
		},
		{
			name: 'sitekit/search-console',
			label: __( 'Search Console Settings', 'google-site-kit' ),
			callback: () => {
				global.location.href = `${
					global.googlesitekit?.admin?.adminURL || '/wp-admin/'
				}admin.php?page=googlesitekit-settings#/connected-services/search-console`;
			},
		},
	];

	// Register each command
	wpCommands.forEach( ( command ) => {
		global.wp.commands.registerCommand( command );
	} );
}

// Register commands when WordPress is ready
if ( global.wp?.domReady ) {
	global.wp.domReady( registerSiteKitCommands );
} else {
	// Fallback for immediate registration
	registerSiteKitCommands();
}
