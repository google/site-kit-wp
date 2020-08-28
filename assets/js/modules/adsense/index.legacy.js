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
 * Internal dependencies
 */
import { createAddToFilter } from '../../util/helpers';
import { getSiteKitAdminURL, getModulesData } from '../../util';
import AdSenseDashboardWidget from './components/dashboard/AdSenseDashboardWidget';
import DashboardEarnings from './components/dashboard/DashboardEarnings';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
const slug = 'adsense';

addFilter( 'googlesitekit.SetupModuleShowLink',
	'googlesitekit.adsenseSetupModuleShowLink', ( showLink, moduleSlug ) => {
		if ( 'adsense' === moduleSlug && ! global._googlesitekitLegacyData.canAdsRun ) {
			return false;
		}
		return showLink;
	} );

const modulesData = getModulesData();
if ( modulesData.adsense.active ) {
	const addAdSenseDashboardWidget = createAddToFilter( <AdSenseDashboardWidget /> );
	const addDashboardEarnings = createAddToFilter( <DashboardEarnings /> );

	// If setup is complete, show the AdSense data.
	if ( modulesData[ slug ].setupComplete ) {
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
		} = global._googlesitekitLegacyData.admin;
		const id = currentScreen ? currentScreen.id : null;

		if ( ! reAuth && 'site-kit_page_googlesitekit-module-adsense' === id ) {
			// Setup incomplete: redirect to the setup flow.
			global.location = getSiteKitAdminURL(
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
				const { settings } = modulesData[ slug ];
				if ( ! isConnected && undefined !== settings && ( 'graylisted' === settings.accountStatus || 'pending' === settings.accountStatus ) ) {
					return true;
				}
				return isConnected;
			} );
	}

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
	addFilter( `googlesitekit.showDateRangeSelector-${ slug }`,
		'googlesitekit.analyticsShowDateRangeSelector',
		() => true );
}
