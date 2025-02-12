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
import PartnerAdsPAXWidget from './components/dashboard/PartnerAdsPAXWidget';
import { AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import {
	PAXSetupSuccessSubtleNotification,
	SetupSuccessSubtleNotification,
} from './components/notifications';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from './pax/constants';
import AdsModuleSetupCTAWidget from '../../components/notifications/AdsModuleSetupCTAWidget';

export { registerStore } from './datastore';

const ADS_SETUP_CTA_ID = 'ads-setup-cta';

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

export const registerWidgets = ( widgets ) => {
	if ( isFeatureEnabled( 'adsPax' ) ) {
		widgets.registerWidget(
			'partnerAdsPAX',
			{
				Component: PartnerAdsPAXWidget,
				width: widgets.WIDGET_WIDTHS.FULL,
				priority: 20,
				wrapWidget: false,
				modules: [ 'ads' ],
			},
			[ AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY ]
		);
	}
};

export const registerNotifications = ( notifications ) => {
	notifications.registerNotification( 'setup-success-notification-ads', {
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
	} );

	notifications.registerNotification( 'setup-success-notification-pax', {
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
	} );

	notifications.registerNotification( ADS_SETUP_CTA_ID, {
		Component: AdsModuleSetupCTAWidget,
		priority: 30,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isPromptDismissed selector relies on the resolution
				// of the getDismissedPrompts() resolver.
				resolveSelect( CORE_USER ).getDismissedPrompts(),
				resolveSelect( CORE_MODULES ).isModuleConnected( 'ads' ),
				resolveSelect( CORE_MODULES ).canActivateModule( 'ads' ),
			] );

			const isAdsConnected =
				select( CORE_MODULES ).isModuleConnected( 'ads' );

			const isDismissed =
				select( CORE_USER ).isPromptDismissed( ADS_SETUP_CTA_ID );

			const canActivateAdsModule =
				select( CORE_MODULES ).canActivateModule( 'ads' );

			if ( isAdsConnected || ! canActivateAdsModule || isDismissed ) {
				return false;
			}

			return true;
		},
		isDismissible: true,
		dismissRetries: 1,
		featureFlag: 'adsPax',
	} );
};
