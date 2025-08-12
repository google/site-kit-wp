/**
 * Command Palette component.
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
import {
	Fragment,
	useCallback,
	useEffect,
	useState,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Dialog, DialogContent } from 'googlesitekit-components';
import { useKeyboardShortcuts } from './KeyboardShortcutProvider';

/**
 * Available commands/pages for navigation
 */
const COMMANDS = [
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
 * Filters commands based on search query
 */
function filterCommands( query ) {
	if ( ! query.trim() ) {
		return COMMANDS;
	}

	const searchTerm = query.toLowerCase().trim();

	return COMMANDS.filter( ( command ) => {
		// Search in title
		if ( command.title.toLowerCase().includes( searchTerm ) ) {
			return true;
		}

		// Search in description
		if ( command.description.toLowerCase().includes( searchTerm ) ) {
			return true;
		}

		// Search in keywords
		return command.keywords.some( ( keyword ) =>
			keyword.toLowerCase().includes( searchTerm )
		);
	} );
}

/**
 * Groups commands by category
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

export default function CommandPalette() {
	const [ query, setQuery ] = useState( '' );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ isVisible, setIsVisible ] = useState( false );
	const inputRef = useRef( null );
	const { executeShortcut } = useKeyboardShortcuts();

	const filteredCommands = filterCommands( query );
	const groupedCommands = groupCommands( filteredCommands );

	// Flatten commands for keyboard navigation
	const flatCommands = Object.values( groupedCommands ).flat();

	/**
	 * Handles command execution
	 */
	const executeCommand = useCallback(
		( command ) => {
			// Create a mock shortcut object for the executeShortcut function
			const mockShortcut = {
				action: command.action,
				target: command.target,
			};

			executeShortcut( mockShortcut );
			setIsVisible( false );
			setQuery( '' );
			setSelectedIndex( 0 );
		},
		[ executeShortcut ]
	);

	/**
	 * Handles keyboard navigation
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
	 * Handles search input changes
	 */
	const handleInputChange = useCallback( ( event ) => {
		setQuery( event.target.value );
		setSelectedIndex( 0 ); // Reset selection when search changes
	}, [] );

	/**
	 * Handles command clicks
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
			<DialogContent
				style={ {
					padding: 0,
					maxHeight: '70vh',
					width: '100%',
					maxWidth: '600px',
					minWidth: window.innerWidth < 640 ? '90vw' : '400px',
					overflow: 'hidden',
					margin: window.innerWidth < 640 ? '16px' : '24px',
				} }
			>
				<div
					className="googlesitekit-command-palette__content"
					style={ {
						display: 'flex',
						flexDirection: 'column',
						height: '100%',
					} }
				>
					<div
						className="googlesitekit-command-palette__search"
						style={ {
							borderBottom: '1px solid #e0e0e0',
							padding: '20px 24px',
							position: 'relative',
							width: '100%',
							boxSizing: 'border-box',
						} }
					>
						<div
							style={ {
								position: 'absolute',
								left: '24px',
								top: '50%',
								transform: 'translateY(-50%)',
								fontSize: '16px',
								opacity: 0.5,
							} }
						>
							🔍
						</div>
						<input
							ref={ inputRef }
							type="text"
							value={ query }
							onChange={ handleInputChange }
							onKeyDown={ handleKeyDown }
							placeholder={ __(
								'Search for pages, settings, or actions...',
								'google-site-kit'
							) }
							className="googlesitekit-command-palette__input"
							style={ {
								background: 'transparent',
								border: 'none',
								fontSize: '18px',
								outline: 'none',
								paddingLeft: '32px',
								paddingRight: '8px',
								width: '100%',
								boxSizing: 'border-box',
								maxWidth: '100%',
							} }
						/>
					</div>

					<div
						className="googlesitekit-command-palette__results"
						style={ {
							flex: 1,
							maxHeight: '400px',
							overflowY: 'auto',
							padding: 0,
						} }
					>
						{ flatCommands.length === 0 ? (
							<div
								className="googlesitekit-command-palette__no-results"
								style={ {
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									padding: '48px 24px',
									color: '#666',
									fontSize: '15px',
									textAlign: 'center',
								} }
							>
								{ query.trim()
									? __(
											'No results found',
											'google-site-kit'
									  )
									: __(
											'Type to search for pages, settings, or actions...',
											'google-site-kit'
									  ) }
							</div>
						) : (
							Object.entries( groupedCommands ).map(
								( [ category, commands ] ) => (
									<div
										key={ category }
										className="googlesitekit-command-palette__group"
										style={ {
											marginBottom: 0,
											borderBottom:
												category !==
												Object.keys( groupedCommands )[
													Object.keys(
														groupedCommands
													).length - 1
												]
													? '1px solid rgba(0,0,0,0.05)'
													: 'none',
										} }
									>
										<div
											className="googlesitekit-command-palette__group-title"
											style={ {
												background: 'rgba(0,0,0,0.02)',
												color: '#666',
												fontSize: '12px',
												fontWeight: 600,
												textTransform: 'uppercase',
												padding: '8px 24px',
												letterSpacing: '0.3px',
											} }
										>
											{ category }
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
														style={ {
															background:
																isSelected
																	? 'rgba(66, 133, 244, 0.08)'
																	: 'transparent',
															border: 'none',
															borderLeft:
																isSelected
																	? '3px solid #4285f4'
																	: 'none',
															cursor: 'pointer',
															display: 'block',
															padding: isSelected
																? '16px 21px 16px 21px'
																: '16px 24px',
															textAlign: 'left',
															transition:
																'all 0.2s ease',
															width: '100%',
														} }
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
														<div
															className="googlesitekit-command-palette__command-content"
															style={ {
																display: 'flex',
																flexDirection:
																	'column',
																gap: '4px',
															} }
														>
															<div
																className="googlesitekit-command-palette__command-title"
																style={ {
																	fontSize:
																		'15px',
																	fontWeight: 500,
																	lineHeight: 1.3,
																	color: '#333',
																} }
															>
																{
																	command.title
																}
															</div>
															<div
																className="googlesitekit-command-palette__command-description"
																style={ {
																	fontSize:
																		'13px',
																	lineHeight: 1.4,
																	color: '#666',
																	opacity: 0.8,
																} }
															>
																{
																	command.description
																}
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

					<div
						className="googlesitekit-command-palette__footer"
						style={ {
							background: 'rgba(0,0,0,0.02)',
							borderTop: '1px solid #e0e0e0',
							padding: '12px 24px',
						} }
					>
						<div
							className="googlesitekit-command-palette__hint"
							style={ {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '12px',
								color: '#666',
								gap: '4px',
							} }
						>
							<kbd
								style={ {
									background: 'rgba(255,255,255,0.9)',
									border: '1px solid rgba(0,0,0,0.15)',
									borderRadius: '4px',
									padding: '4px 6px',
									fontSize: '11px',
									fontWeight: 600,
									minWidth: '20px',
									textAlign: 'center',
								} }
							>
								↑
							</kbd>
							<kbd
								style={ {
									background: 'rgba(255,255,255,0.9)',
									border: '1px solid rgba(0,0,0,0.15)',
									borderRadius: '4px',
									padding: '4px 6px',
									fontSize: '11px',
									fontWeight: 600,
									minWidth: '20px',
									textAlign: 'center',
								} }
							>
								↓
							</kbd>{ ' ' }
							to navigate,
							<kbd
								style={ {
									background: 'rgba(255,255,255,0.9)',
									border: '1px solid rgba(0,0,0,0.15)',
									borderRadius: '4px',
									padding: '4px 6px',
									fontSize: '11px',
									fontWeight: 600,
									minWidth: '20px',
									textAlign: 'center',
								} }
							>
								↵
							</kbd>{ ' ' }
							to select,{ ' ' }
							<kbd
								style={ {
									background: 'rgba(255,255,255,0.9)',
									border: '1px solid rgba(0,0,0,0.15)',
									borderRadius: '4px',
									padding: '4px 6px',
									fontSize: '11px',
									fontWeight: 600,
									minWidth: '20px',
									textAlign: 'center',
								} }
							>
								esc
							</kbd>{ ' ' }
							to close
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
