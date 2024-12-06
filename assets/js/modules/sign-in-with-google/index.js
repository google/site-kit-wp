/**
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	ERROR_CODE_NON_HTTPS_SITE,
	MODULES_SIGN_IN_WITH_GOOGLE,
} from './datastore/constants';
import Icon from '../../../svg/graphics/sign-in-with-google.svg';
import SetupMain from './components/setup/SetupMain';
import SettingsEdit from './components/settings/SettingsEdit';
import SettingsView from './components/settings/SettingsView';
import SignInWithGoogleSetupCTABanner from './components/dashboard/SignInWithGoogleSetupCTABanner';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { isFeatureEnabled } from '../../features';
import { isURLUsingHTTPS } from '../../util/is-url-using-https';

export { registerStore } from './datastore';

export function registerModule( modules ) {
	modules.registerModule( 'sign-in-with-google', {
		storeName: MODULES_SIGN_IN_WITH_GOOGLE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		onCompleteSetup: async ( registry, finishSetup ) => {
			const { submitChanges } = registry.dispatch(
				MODULES_SIGN_IN_WITH_GOOGLE
			);

			const response = await submitChanges();
			if ( ! response.error ) {
				finishSetup();
			}
		},
		Icon,
		features: [
			__(
				'Users will no longer be able to sign in to your WordPress site using their Google Accounts',
				'google-site-kit'
			),
			__(
				'Users will not be able to create an account on your site using their Google Account (if account creation is enabled)',
				'google-site-kit'
			),
			__(
				'Existing users who have only used Sign in with Google to sign in to your site will need to use WordPress\' "Reset my password" to set a password for their account',
				'google-site-kit'
			),
		],
		checkRequirements: async ( registry ) => {
			// Ensure the site info is resolved to get the home URL.
			await registry.resolveSelect( CORE_SITE ).getSiteInfo();
			const homeURL = registry.select( CORE_SITE ).getHomeURL();

			if ( isURLUsingHTTPS( homeURL ) ) {
				return;
			}

			throw {
				code: ERROR_CODE_NON_HTTPS_SITE,
				message: __(
					'The site should use HTTPS to set up Sign in with Google',
					'google-site-kit'
				),
				data: null,
			};
		},
	} );
}

export const registerNotifications = ( notifications ) => {
	if ( isFeatureEnabled( 'signInWithGoogleModule' ) ) {
		notifications.registerNotification( 'sign-in-with-google-setup-cta', {
			Component: SignInWithGoogleSetupCTABanner,
			priority: 330,
			areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
			groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			checkRequirements: async ( { select, resolveSelect } ) => {
				if ( 1 ) {
					return true;
				}
				await Promise.all( [
					// The isModuleConnected() relies on the resolution
					// of the getModules() resolver.
					resolveSelect( CORE_MODULES ).getModules(),
					// Ensure the site info is resolved to get the home URL.
					resolveSelect( CORE_SITE ).getSiteInfo(),
				] );

				const isConnected = select( CORE_MODULES ).isModuleConnected(
					'sign-in-with-google'
				);
				if ( isConnected ) {
					return false;
				}

				const homeURL = select( CORE_SITE ).getHomeURL();
				if ( ! isURLUsingHTTPS( homeURL ) ) {
					return false;
				}

				return true;
			},
			isDismissible: true,
		} );
	}
};
