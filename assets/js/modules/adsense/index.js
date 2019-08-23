/**
 * AdSense module initialization.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { createAddToFilter } from 'GoogleUtil/helpers';
import { fillFilterWithComponent, getSiteKitAdminURL } from 'GoogleUtil';
/**
 * Internal dependencies
 */
import AdSenseDashboardWidget from './dashboard/dashboard-widget';
import DashboardEarnings from './dashboard/dashboard-earnings';
import AdSenseSettings from './settings/adsense-settings';
import AdSenseModuleStatus from './dashboard/adsense-module-status';
import AdSenseSettingsStatus from './settings/adsense-settings-status';
import AdSenseSettingsWarning from './settings/adsense-settings-warning';

const { addFilter } = wp.hooks;
const slug = 'adsense';

/**
 * Append ad blocker warning.
 */
addFilter( 'googlesitekit.ModuleSettingsWarning',
	'googlesitekit.adsenseSettingsWarning',
	fillFilterWithComponent( AdSenseSettingsWarning, {} ) );

addFilter( 'googlesitekit.SetupModuleShowLink',
	'googlesitekit.adsenseSetupModuleShowLink', ( showLink, moduleSlug ) => {
		if ( 'adsense' === moduleSlug && ! googlesitekit.canAdsRun ) {
			return false;
		}
		return showLink;
	} );

if ( googlesitekit.modules.adsense.active ) {
	const addAdSenseDashboardWidget = createAddToFilter( <AdSenseDashboardWidget /> );
	const addDashboardEarnings = createAddToFilter( <DashboardEarnings /> );

	// If setup is complete, show the AdSense data.
	if ( googlesitekit.modules[ slug ].setupComplete ) {
		/**
		 * Action triggered when the settings App is loaded.
		 */
		addFilter( `googlesitekit.ModuleApp-${ slug }`,
			'googlesitekit.ModuleApp',
			addAdSenseDashboardWidget );

		addFilter( 'googlesitekit.DashboardModule',
			'googlesitekit.DashboardEarningModule',
			addDashboardEarnings, 50 );
	} else {
		const {
			reAuth,
			currentScreen,
		} = googlesitekit.admin;
		const id = currentScreen ? currentScreen.id : null;

		if ( ! reAuth && 'site-kit_page_googlesitekit-module-adsense' === id ) {
			// Setup incomplete: redirect to the setup flow.
			window.location = getSiteKitAdminURL(
				`googlesitekit-module-${ slug }`,
				{
					reAuth: true,
					slug,
				}
			);
		}

		// Show module as connected in the settings when status is pending review.
		addFilter( `googlesitekit.Connected-${ slug }`,
			'googlesitekit.AdSenseModuleConnected', ( isConnected ) => {
				const { settings } = googlesitekit.modules[ slug ];
				if ( ! isConnected && undefined !== settings && ( 'account-pending-review' === settings.accountStatus || 'ads-display-pending' === settings.accountStatus ) ) {
					return true;
				}
				return isConnected;
			} );
	}

	/**
	 * Add components to the settings page.
	 */
	addFilter( `googlesitekit.ModuleSettingsDetails-${ slug }`,
		'googlesitekit.AdSenseModuleSettingsDetails',
		fillFilterWithComponent( AdSenseSettings, {
			onSettingsPage: true,
		} ) );

	/**
	 * Add component to the setup wizard
	 */
	addFilter( `googlesitekit.ModuleSetup-${ slug }`,
		'googlesitekit.TagmanagerModuleSetupWizard',
		fillFilterWithComponent( AdSenseModuleStatus, {
			onSettingsPage: false,
		} ) );

	/**
	 * Set AdSense to auto refresh status when account is not connected.
	 */
	addFilter( 'googlesitekit.autoRefreshModules',
		'googlesitekit.AdSenseAutoRefresh', ( modules ) => {
			modules.push( {
				identifier: 'adsense',
				toRefresh: () => {
					let status = '';
					if ( googlesitekit.modules.adsense && googlesitekit.modules.adsense[ 'account-status' ] ) {
						status = googlesitekit.modules.adsense[ 'account-status' ].accountStatus;
					}

					if ( status && -1 < status.indexOf( 'account-connected' ) ) {
						return false;
					}
					return true;
				},
			} );
			return modules;
		} );

	/**
 	 * Add components to the Notification requests.
 	 */
	addFilter( 'googlesitekit.ModulesNotificationsRequest',
		'googlesitekit.adsenseNotifications', ( modules ) => {
			modules.push( {
				identifier: 'adsense',
			} );
			return modules;
		} );

	/**
	 * Filter the settings message when the module setup is incomplete.
	 */
	addFilter( 'googlesitekit.ModuleSetupIncomplete',
		'googlesitekit.adsenseSettingStatus',
		fillFilterWithComponent( AdSenseSettingsStatus, {} ) );
}

