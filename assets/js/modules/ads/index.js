/**
 * Ads module initialization.
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
import AdsIcon from '../../../svg/graphics/ads.svg';
import { SettingsEdit, SettingsView } from './components/settings';
import { SetupMain, SetupMainPAX } from './components/setup';
import { MODULES_ADS } from './datastore/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	CORE_USER,
	ERROR_CODE_ADBLOCKER_ACTIVE,
} from '../../googlesitekit/datastore/user/constants';
import { isFeatureEnabled } from '../../features';
import {
	PAXSetupSuccessSubtleNotification,
	SetupSuccessSubtleNotification,
	AccountLinkedViaGoogleForWooCommerceSubtleNotification,
} from './components/notifications';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from './pax/constants';
import AdsModuleSetupCTAWidget from '../../components/notifications/AdsModuleSetupCTAWidget';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'ads', {
		storeName: MODULES_ADS,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: isFeatureEnabled( 'adsPax' ) ? SetupMainPAX : SetupMain,
		Icon: AdsIcon,
		features: [
			__(
				'Tagging necessary for your ads campaigns to work will be disabled',
				'google-site-kit'
			),
			__(
				'Conversion tracking for your ads campaigns will be disabled',
				'google-site-kit'
			),
		],
		checkRequirements: async ( registry ) => {
			const adBlockerActive = await registry
				.resolveSelect( CORE_USER )
				.isAdBlockerActive();

			if ( ! adBlockerActive ) {
				return;
			}

			const message = registry
				.select( MODULES_ADS )
				.getAdBlockerWarningMessage();

			throw {
				code: ERROR_CODE_ADBLOCKER_ACTIVE,
				message,
				data: null,
			};
		},
	} );
};

export const registerWidgets = () => {};

export const ADS_NOTIFICATIONS = {
	'setup-success-notification-ads': {
		Component: SetupSuccessSubtleNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: () => {
			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			if ( 'authentication_success' === notification && slug === 'ads' ) {
				return true;
			}

			return false;
		},
	},
	'setup-success-notification-pax': {
		Component: PAXSetupSuccessSubtleNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: () => {
			const notification = getQueryArg( location.href, 'notification' );

			if ( PAX_SETUP_SUCCESS_NOTIFICATION === notification ) {
				return true;
			}

			return false;
		},
	},
	'account-linked-via-google-for-woocommerce': {
		Component: AccountLinkedViaGoogleForWooCommerceSubtleNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			// isWooCommerceActivated, isGoogleForWooCommerceActivated and isGoogleForWooCommerceLinked are all relying
			// on the data being resolved in getModuleData() selector.
			await resolveSelect( MODULES_ADS ).getModuleData();

			const {
				isWooCommerceActivated,
				isGoogleForWooCommerceActivated,
				hasGoogleForWooCommerceAdsAccount,
			} = select( MODULES_ADS );

			return (
				isWooCommerceActivated() &&
				isGoogleForWooCommerceActivated() &&
				hasGoogleForWooCommerceAdsAccount()
			);
		},
		featureFlag: 'adsPax',
		isDismissible: true,
	},
	'ads-setup-cta': {
		Component: AdsModuleSetupCTAWidget,
		// This notification should be displayed before audience segmentation one,
		// which has priority of 310
		priority: 300,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isPromptDismissed selector relies on the resolution
				// of the getDismissedPrompts() resolver.
				resolveSelect( CORE_USER ).getDismissedPrompts(),
				// isGoogleForWooCommerceLinked is relying
				// on the data being resolved in getModuleData() selector.
				resolveSelect( MODULES_ADS ).getModuleData(),
				resolveSelect( CORE_MODULES ).isModuleConnected( 'ads' ),
				resolveSelect( CORE_MODULES ).canActivateModule( 'ads' ),
			] );

			const { isModuleConnected, canActivateModule } =
				select( CORE_MODULES );
			const { isPromptDismissed } = select( CORE_USER );
			const { hasGoogleForWooCommerceAdsAccount } = select( MODULES_ADS );

			const isAdsConnected = isModuleConnected( 'ads' );
			const isDismissed = isPromptDismissed( 'ads-setup-cta' );
			const canActivateAdsModule = canActivateModule( 'ads' );

			return (
				isAdsConnected === false &&
				canActivateAdsModule &&
				isDismissed === false &&
				hasGoogleForWooCommerceAdsAccount() === false
			);
		},
		isDismissible: true,
		dismissRetries: 1,
		featureFlag: 'adsPax',
	},
};

export const registerNotifications = ( notifications ) => {
	for ( const notificationID in ADS_NOTIFICATIONS ) {
		notifications.registerNotification(
			notificationID,
			ADS_NOTIFICATIONS[ notificationID ]
		);
	}
};
