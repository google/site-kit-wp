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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	ERROR_CODE_NON_HTTPS_SITE,
	LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY,
	PUBLICATION_ONBOARDING_STATES,
} from './datastore/constants';
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import ReaderRevenueManagerIcon from '@/svg/graphics/reader-revenue-manager.svg';
import { isURLUsingHTTPS } from '@/js/util/is-url-using-https';
import {
	ReaderRevenueManagerSetupCTABanner,
	RRMSetupSuccessSubtleNotification,
} from './components/dashboard';
import {
	NOTIFICATION_GROUPS,
	NOTIFICATION_AREAS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import ProductIDContributionsNotification from './components/dashboard/ProductIDContributionsNotification';
import {
	RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID,
	RRM_PRODUCT_ID_SUBSCRIPTIONS_NOTIFICATION_ID,
	RRM_SETUP_NOTIFICATION_ID,
	RRM_SETUP_SUCCESS_NOTIFICATION_ID,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from './constants';
import ProductIDSubscriptionsNotification from './components/dashboard/ProductIDSubscriptionsNotification';
import PublicationApprovedOverlayNotification, {
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
} from './components/dashboard/PublicationApprovedOverlayNotification';
import RRMIntroductoryOverlayNotification, {
	RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from './components/dashboard/RRMIntroductoryOverlayNotification';

export { registerStore } from './datastore';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_READER_REVENUE_MANAGER, {
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
					'The site should use HTTPS to set up Reader Revenue Manager',
					'google-site-kit'
				),
				data: null,
			};
		},
	} );
}

async function checkRequirementsForProductIDNotification(
	{ select, resolveSelect },
	requiredPaymentOption
) {
	await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

	const publicationOnboardingState = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationOnboardingState();

	const paymentOption = select(
		MODULES_READER_REVENUE_MANAGER
	).getPaymentOption();

	const productIDs = select( MODULES_READER_REVENUE_MANAGER ).getProductIDs();

	const productID = select( MODULES_READER_REVENUE_MANAGER ).getProductID();

	if (
		publicationOnboardingState ===
			PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE &&
		productIDs.length > 0 &&
		productID === 'openaccess' &&
		paymentOption === requiredPaymentOption
	) {
		return true;
	}

	return false;
}

export const NOTIFICATIONS = {
	[ RRM_SETUP_NOTIFICATION_ID ]: {
		Component: ReaderRevenueManagerSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isPromptDismissed selector relies on the resolution
				// of the getDismissedPrompts() resolver.
				resolveSelect( CORE_USER ).getDismissedPrompts(),
				resolveSelect( CORE_MODULES ).isModuleConnected(
					MODULE_SLUG_READER_REVENUE_MANAGER
				),
				resolveSelect( CORE_MODULES ).canActivateModule(
					MODULE_SLUG_READER_REVENUE_MANAGER
				),
			] );

			// Check if the prompt with the legacy key used before the banner was refactored
			// to use the `notification ID` as the dismissal key, is dismissed.
			const isLegacyDismissed = select( CORE_USER ).isPromptDismissed(
				LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY
			);

			const isRRMModuleConnected = select(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER );

			const canActivateRRMModule = select(
				CORE_MODULES
			).canActivateModule( MODULE_SLUG_READER_REVENUE_MANAGER );

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
	[ RRM_SETUP_SUCCESS_NOTIFICATION_ID ]: {
		Component: RRMSetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			const rrmConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER );

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
				slug === MODULE_SLUG_READER_REVENUE_MANAGER &&
				publicationOnboardingState !== undefined
			) {
				return true;
			}

			return false;
		},
		isDismissible: false,
	},
	[ RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID ]: {
		Component: ProductIDContributionsNotification,
		priority: 20,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( registry ) => {
			const isActive = await checkRequirementsForProductIDNotification(
				registry,
				'contributions'
			);

			return isActive;
		},
	},
	[ RRM_PRODUCT_ID_SUBSCRIPTIONS_NOTIFICATION_ID ]: {
		Component: ProductIDSubscriptionsNotification,
		priority: 20,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( registry ) => {
			const isActive = await checkRequirementsForProductIDNotification(
				registry,
				'subscriptions'
			);

			return isActive;
		},
	},
	[ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION ]: {
		Component: PublicationApprovedOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { resolveSelect, dispatch } ) => {
			const rrmConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER );

			if ( ! rrmConnected ) {
				return false;
			}

			const {
				publicationOnboardingState,
				paymentOption,
				publicationOnboardingStateChanged,
			} =
				( await resolveSelect(
					MODULES_READER_REVENUE_MANAGER
				).getSettings() ) || {};

			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );
			const showingSuccessNotification =
				notification === 'authentication_success' &&
				slug === MODULE_SLUG_READER_REVENUE_MANAGER;

			// Show the overlay if the publication onboarding state is complete, and if either
			// setup has just been completed but there is no paymentOption selected, or if the
			// publication onboarding state has just changed.
			if (
				publicationOnboardingState ===
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE &&
				( ( showingSuccessNotification && paymentOption === '' ) ||
					publicationOnboardingStateChanged === true )
			) {
				// If the publication onboarding state has changed, reset it to false and save the settings.
				// This is to ensure that the overlay is not shown again for this reason.
				if ( publicationOnboardingStateChanged === true ) {
					const {
						saveSettings,
						setPublicationOnboardingStateChanged,
					} = dispatch( MODULES_READER_REVENUE_MANAGER );

					setPublicationOnboardingStateChanged( false );
					saveSettings();
				}

				return true;
			}

			return false;
		},
	},
	[ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ]: {
		Component: RRMIntroductoryOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { resolveSelect } ) => {
			const rrmConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER );

			if ( ! rrmConnected ) {
				return false;
			}

			const { publicationOnboardingState, paymentOption } =
				( await resolveSelect(
					MODULES_READER_REVENUE_MANAGER
				).getSettings() ) || {};

			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );
			const showingSuccessNotification =
				notification === 'authentication_success' &&
				slug === MODULE_SLUG_READER_REVENUE_MANAGER;

			if (
				publicationOnboardingState ===
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE &&
				[ 'noPayment', '' ].includes( paymentOption ) &&
				! showingSuccessNotification
			) {
				return true;
			}

			return false;
		},
	},
};

export function registerNotifications( notificationsAPI ) {
	for ( const notificationID in NOTIFICATIONS ) {
		notificationsAPI.registerNotification(
			notificationID,
			NOTIFICATIONS[ notificationID ]
		);
	}
}
