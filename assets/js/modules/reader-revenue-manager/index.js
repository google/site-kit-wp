/**
 * Reader Revenue Manager module initialization.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	ERROR_CODE_NON_HTTPS_SITE,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY,
	PUBLICATION_ONBOARDING_STATES,
} from './datastore/constants';
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import ReaderRevenueManagerIcon from '../../../svg/graphics/reader-revenue-manager.svg';
import { isURLUsingHTTPS } from './utils/validation';
import {
	ReaderRevenueManagerSetupCTABanner,
	RRMSetupSuccessSubtleNotification,
} from './components/dashboard';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { isFeatureEnabled } from '../../features';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import ProductIDNotification from './components/dashboard/ProductIDNotification';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'reader-revenue-manager', {
		storeName: MODULES_READER_REVENUE_MANAGER,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: ReaderRevenueManagerIcon,
		features: [
			__(
				'Reader Revenue Manager publication tracking will be disabled',
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
					'The site should use HTTPS to set up Reader Revenue Manager',
					'google-site-kit'
				),
				data: null,
			};
		},
	} );
};

export const NOTIFICATIONS = {
	'rrm-setup-notification': {
		Component: ReaderRevenueManagerSetupCTABanner,
		priority: 50,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isPromptDismissed selector relies on the resolution
				// of the getDismissedPrompts() resolver.
				resolveSelect( CORE_USER ).getDismissedPrompts(),
				resolveSelect( CORE_MODULES ).isModuleConnected(
					READER_REVENUE_MANAGER_MODULE_SLUG
				),
				resolveSelect( CORE_MODULES ).canActivateModule(
					READER_REVENUE_MANAGER_MODULE_SLUG
				),
			] );

			// Check if the prompt with the legacy key used before the banner was refactored
			// to use the `notification ID` as the dismissal key, is dismissed.
			const isLegacyDismissed = select( CORE_USER ).isPromptDismissed(
				LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY
			);

			const isRRMModuleConnected = select(
				CORE_MODULES
			).isModuleConnected( READER_REVENUE_MANAGER_MODULE_SLUG );

			const canActivateRRMModule = select(
				CORE_MODULES
			).canActivateModule( READER_REVENUE_MANAGER_MODULE_SLUG );

			if (
				isLegacyDismissed === false &&
				isRRMModuleConnected === false &&
				canActivateRRMModule
			) {
				return true;
			}

			return false;
		},
		isDismissible: true,
		dismissRetries: 1,
	},
	'setup-success-notification-rrm': {
		Component: RRMSetupSuccessSubtleNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			const rrmConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( READER_REVENUE_MANAGER_MODULE_SLUG );

			if ( ! rrmConnected ) {
				return false;
			}

			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();
			const publicationOnboardingState = await select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationOnboardingState();

			if (
				notification === 'authentication_success' &&
				slug === READER_REVENUE_MANAGER_MODULE_SLUG &&
				publicationOnboardingState !== undefined
			) {
				return true;
			}

			return false;
		},
		isDismissible: false,
	},
};

if ( isFeatureEnabled( 'rrmModuleV2' ) ) {
	NOTIFICATIONS[ 'rrm-product-id-notification' ] = {
		Component: ProductIDNotification,
		priority: 20,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect } ) => {
			await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

			const publicationOnboardingState = select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationOnboardingState();

			const paymentOption = select(
				MODULES_READER_REVENUE_MANAGER
			).getPaymentOption();

			const productIDs = select(
				MODULES_READER_REVENUE_MANAGER
			).getProductIDs();

			const productID = select(
				MODULES_READER_REVENUE_MANAGER
			).getProductID();

			if (
				publicationOnboardingState ===
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE &&
				productIDs.length > 0 &&
				! productID &&
				( paymentOption === 'contributions' ||
					paymentOption === 'subscriptions' )
			) {
				return true;
			}
		},
	};
}

export const registerNotifications = ( notificationsAPI ) => {
	if ( isFeatureEnabled( 'rrmModule' ) ) {
		for ( const notificationID in NOTIFICATIONS ) {
			notificationsAPI.registerNotification(
				notificationID,
				NOTIFICATIONS[ notificationID ]
			);
		}
	}
};
