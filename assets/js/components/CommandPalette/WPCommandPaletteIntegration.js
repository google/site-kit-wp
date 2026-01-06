/**
 * WordPress Command Palette Integration for Site Kit.
 *
 * This module extends the WordPress core Command Palette (Cmd+K / Ctrl+K)
 * with comprehensive Site Kit navigation commands and deep links.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Gets the admin URL for Site Kit pages.
 *
 * @since n.e.x.t
 *
 * @return {string} The admin URL.
 */
function getAdminURL() {
	return global.googlesitekit?.admin?.adminURL || '/wp-admin/';
}

/**
 * Navigates to a Site Kit page.
 *
 * @since n.e.x.t
 *
 * @param {string} page The page slug (e.g., 'dashboard', 'settings').
 * @param {string} hash Optional hash for deep linking (e.g., '/connected-services').
 */
function navigateToPage( page, hash = '' ) {
	const url = `${ getAdminURL() }admin.php?page=googlesitekit-${ page }${
		hash ? `#${ hash }` : ''
	}`;
	global.location.href = url;
}

/**
 * Site Kit commands for WordPress Command Palette.
 * Organized by category for better maintainability.
 *
 * Note: Icons are omitted to avoid React compatibility issues with
 * WordPress Command Palette's expected icon format.
 */
const SITEKIT_COMMANDS = {
	// Main Navigation
	mainPages: [
		{
			name: 'sitekit/dashboard',
			label: __( 'Go to: Site Kit > Dashboard', 'google-site-kit' ),
			searchLabel: __(
				'site kit dashboard overview analytics metrics home main',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'dashboard' ),
		},
		{
			name: 'sitekit/settings',
			label: __( 'Go to: Site Kit > Settings', 'google-site-kit' ),
			searchLabel: __(
				'site kit settings configuration options preferences',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'settings' ),
		},
	],

	// Settings Tabs
	settingsTabs: [
		{
			name: 'sitekit/connected-services',
			label: __(
				'Go to: Site Kit > Connected Services',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit connected services manage modules google services active',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'settings', '/connected-services' ),
		},
		{
			name: 'sitekit/connect-more-services',
			label: __(
				'Go to: Site Kit > Connect More Services',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit connect more services add new modules install',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage( 'settings', '/connect-more-services' ),
		},
		{
			name: 'sitekit/admin-settings',
			label: __( 'Go to: Site Kit > Admin Settings', 'google-site-kit' ),
			searchLabel: __(
				'site kit admin settings advanced configuration admin options',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'settings', '/admin-settings' ),
		},
	],

	// Module Settings - Deep Links
	moduleSettings: [
		{
			name: 'sitekit/analytics-settings',
			label: __(
				'Go to: Site Kit > Analytics Settings',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit analytics settings GA4 google analytics tracking measurement configure',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage( 'settings', '/connected-services/analytics-4' ),
		},
		{
			name: 'sitekit/search-console-settings',
			label: __(
				'Go to: Site Kit > Search Console Settings',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit search console settings GSC SEO search performance indexing',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage(
					'settings',
					'/connected-services/search-console'
				),
		},
		{
			name: 'sitekit/adsense-settings',
			label: __(
				'Go to: Site Kit > AdSense Settings',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit adsense settings ads monetization revenue earnings configure',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage( 'settings', '/connected-services/adsense' ),
		},
		{
			name: 'sitekit/tagmanager-settings',
			label: __(
				'Go to: Site Kit > Tag Manager Settings',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit tag manager settings GTM tags containers tracking configure',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage( 'settings', '/connected-services/tagmanager' ),
		},
		{
			name: 'sitekit/pagespeed-settings',
			label: __(
				'Go to: Site Kit > PageSpeed Insights Settings',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit pagespeed insights settings speed performance lighthouse core web vitals configure',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage(
					'settings',
					'/connected-services/pagespeed-insights'
				),
		},
		{
			name: 'sitekit/ads-settings',
			label: __( 'Go to: Site Kit > Ads Settings', 'google-site-kit' ),
			searchLabel: __(
				'site kit ads settings google ads conversions tracking campaigns configure',
				'google-site-kit'
			),
			callback: () =>
				navigateToPage( 'settings', '/connected-services/ads' ),
		},
	],

	// Special Pages
	specialPages: [
		{
			name: 'sitekit/key-metrics-setup',
			label: __(
				'Go to: Site Kit > Key Metrics Setup',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit key metrics setup select customize dashboard KPIs widgets',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'key-metrics-setup' ),
		},
		{
			name: 'sitekit/user-input',
			label: __( 'Go to: Site Kit > User Input', 'google-site-kit' ),
			searchLabel: __(
				'site kit user input personalization questions goals onboarding',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'user-input' ),
		},
		{
			name: 'sitekit/metric-selection',
			label: __(
				'Go to: Site Kit > Select Key Metrics',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit select key metrics choose metrics dashboard widgets customize',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'metric-selection' ),
		},
		{
			name: 'sitekit/ad-blocking-recovery',
			label: __(
				'Go to: Site Kit > Ad Blocking Recovery',
				'google-site-kit'
			),
			searchLabel: __(
				'site kit ad blocking recovery adsense revenue protection adblocker',
				'google-site-kit'
			),
			callback: () => navigateToPage( 'ad-blocking-recovery' ),
		},
	],

	// View Site (external)
	externalLinks: [
		{
			name: 'sitekit/view-site',
			label: __( 'View site', 'google-site-kit' ),
			searchLabel: __(
				'view site frontend homepage open website preview',
				'google-site-kit'
			),
			callback: () => {
				global.open(
					global.googlesitekit?.admin?.siteURL || '/',
					'_blank'
				);
			},
		},
	],
};

/**
 * Checks if WordPress Command Palette API is available (WP 6.3+).
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether the command palette API is available.
 */
function isCommandPaletteAvailable() {
	return (
		typeof global.wp !== 'undefined' &&
		typeof global.wp.data !== 'undefined' &&
		typeof global.wp.data.dispatch === 'function'
	);
}

/**
 * Gets the commands store dispatch function.
 *
 * @since n.e.x.t
 *
 * @return {Object|null} The commands store dispatch or null if unavailable.
 */
function getCommandsDispatch() {
	if ( ! isCommandPaletteAvailable() ) {
		return null;
	}

	try {
		const commandsDispatch = global.wp.data.dispatch( 'core/commands' );
		return commandsDispatch;
	} catch {
		return null;
	}
}

/**
 * Registers all Site Kit commands with WordPress Command Palette.
 *
 * @since n.e.x.t
 */
export function registerSiteKitWPCommands() {
	const commandsDispatch = getCommandsDispatch();

	if (
		! commandsDispatch ||
		typeof commandsDispatch.registerCommand !== 'function'
	) {
		// WordPress Command Palette API not available (requires WP 6.3+)
		return;
	}

	// Flatten all command categories and register each command
	const allCommands = [
		...SITEKIT_COMMANDS.mainPages,
		...SITEKIT_COMMANDS.settingsTabs,
		...SITEKIT_COMMANDS.moduleSettings,
		...SITEKIT_COMMANDS.specialPages,
		...SITEKIT_COMMANDS.externalLinks,
	];

	allCommands.forEach( ( command ) => {
		try {
			const commandConfig = {
				name: command.name,
				label: command.label,
				callback: ( { close } ) => {
					command.callback();
					if ( typeof close === 'function' ) {
						close();
					}
				},
			};

			// Only add searchLabel if provided
			if ( command.searchLabel ) {
				commandConfig.searchLabel = command.searchLabel;
			}

			commandsDispatch.registerCommand( commandConfig );
		} catch ( error ) {
			// Command may already be registered, ignore errors silently
		}
	} );
}

/**
 * Unregisters all Site Kit commands from WordPress Command Palette.
 *
 * @since n.e.x.t
 */
export function unregisterSiteKitWPCommands() {
	const commandsDispatch = getCommandsDispatch();

	if (
		! commandsDispatch ||
		typeof commandsDispatch.unregisterCommand !== 'function'
	) {
		return;
	}

	const allCommands = [
		...SITEKIT_COMMANDS.mainPages,
		...SITEKIT_COMMANDS.settingsTabs,
		...SITEKIT_COMMANDS.moduleSettings,
		...SITEKIT_COMMANDS.specialPages,
		...SITEKIT_COMMANDS.externalLinks,
	];

	allCommands.forEach( ( command ) => {
		try {
			commandsDispatch.unregisterCommand( command.name );
		} catch {
			// Ignore errors during unregistration
		}
	} );
}

/**
 * Initializes the WordPress Command Palette integration.
 * Should be called when the Site Kit app initializes.
 *
 * @since n.e.x.t
 */
export function initWPCommandPaletteIntegration() {
	// Register commands when DOM is ready using WordPress domReady
	// Fallback to immediate registration if domReady is not available
	if ( global.wp?.domReady ) {
		global.wp.domReady( registerSiteKitWPCommands );
	} else {
		// DOM should already be loaded when Site Kit initializes,
		// so register immediately as fallback
		registerSiteKitWPCommands();
	}
}

// Export commands for testing and extension
export { SITEKIT_COMMANDS };
