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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	ERROR_CODE_NON_HTTPS_SITE,
	MODULES_SIGN_IN_WITH_GOOGLE,
} from './datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from './constants';
import Icon from '@/svg/graphics/sign-in-with-google.svg';
import SetupMain from './components/setup/SetupMain';
import SettingsEdit from './components/settings/SettingsEdit';
import SettingsView from './components/settings/SettingsView';
import SignInWithGoogleSetupCTABanner from './components/dashboard/SignInWithGoogleSetupCTABanner';
import {
	NOTIFICATION_GROUPS,
	NOTIFICATION_AREAS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SETTINGS,
} from '@/js/googlesitekit/constants';
import SetupSuccessSubtleNotification from './components/dashboard/SetupSuccessSubtleNotification';
import { isURLUsingHTTPS } from '@/js/util/is-url-using-https';
import CompatibilityWarningSubtleNotification from './components/dashboard/CompatibilityWarningSubtleNotification';

export { registerStore } from './datastore';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_SIGN_IN_WITH_GOOGLE, {
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
				'Existing users who have only used Sign in with Google to sign in to your site will need to use WordPress’ “Reset my password” to set a password for their account',
				'google-site-kit'
			),
		],
		overrideSetupSuccessNotification: true,
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

export const SIGN_IN_WITH_GOOGLE_NOTIFICATIONS = {
	'sign-in-with-google-setup-cta': {
		Component: SignInWithGoogleSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isModuleConnected() relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				// Ensure the site info is resolved to get the home URL.
				resolveSelect( CORE_SITE ).getSiteInfo(),
			] );

			const isConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE
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
	},
	'setup-success-notification-siwg': {
		Component: SetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: () => {
			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			if (
				'authentication_success' === notification &&
				slug === MODULE_SLUG_SIGN_IN_WITH_GOOGLE
			) {
				return true;
			}

			return false;
		},
	},
	'sign-in-with-google-compatibility-warning': {
		Component: CompatibilityWarningSubtleNotification,
		priority: PRIORITY.WARNING,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_SETTINGS,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
		],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await resolveSelect( CORE_MODULES ).getModules();

			const isConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE
			);

			if ( ! isConnected ) {
				return false;
			}

			// Ensure compatibility checks are loaded only when the module is connected.
			const compatibilityChecks = await resolveSelect(
				MODULES_SIGN_IN_WITH_GOOGLE
			).getCompatibilityChecks( { useCache: true } );

			const errors = compatibilityChecks?.checks || {};

			return Object.keys( errors ).length > 0;
		},
		isDismissible: true,
	},
};

export function registerNotifications( notifications ) {
	for ( const [ notificationID, notificationSettings ] of Object.entries(
		SIGN_IN_WITH_GOOGLE_NOTIFICATIONS
	) ) {
		notifications.registerNotification(
			notificationID,
			notificationSettings
		);
	}
}
