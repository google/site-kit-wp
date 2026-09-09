/**
 * Reader Revenue Manager module notification registrations.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	requireCanActivateModule,
	requireItemDismissed,
	requireModuleActive,
	requireModuleConnected,
	requireModuleNotConnected,
	requirePromptDismissed,
	requireQueryArg,
} from '@/js/googlesitekit/data-requirements';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';
import {
	ExpressSetupResumeNewsletterNotification,
	PolicyViolationNotification,
	RRMSetupSuccessSubtleNotification,
	ReaderRevenueManagerSetupCTABanner,
} from '@/js/modules/reader-revenue-manager/components/dashboard';
import ProductIDContributionsNotification from '@/js/modules/reader-revenue-manager/components/dashboard/ProductIDContributionsNotification';
import ProductIDSubscriptionsNotification from '@/js/modules/reader-revenue-manager/components/dashboard/ProductIDSubscriptionsNotification';
import PublicationApprovedOverlayNotification, {
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
} from '@/js/modules/reader-revenue-manager/components/dashboard/PublicationApprovedOverlayNotification';
import RRMIntroductoryOverlayNotification, {
	RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from '@/js/modules/reader-revenue-manager/components/dashboard/RRMIntroductoryOverlayNotification';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
	RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID,
	RRM_PRODUCT_ID_SUBSCRIPTIONS_NOTIFICATION_ID,
	RRM_SETUP_NOTIFICATION_ID,
	RRM_SETUP_SUCCESS_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	requireContentPolicyState,
	requirePaymentOption,
	requireProductID,
	requireProductIDs,
	requirePublicationOnboardingState,
} from '@/js/modules/reader-revenue-manager/data-requirements';
import {
	EXPRESS_SETUP_CTAS,
	EXTREME_POLICY_VIOLATION_STATES,
	LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY,
	MODULES_READER_REVENUE_MANAGER,
	POLICY_VIOLATION_STATES,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { checkRequirementsForExpressSetupResumeNotification } from '@/js/modules/reader-revenue-manager/utils/notifications';
import {
	asyncRequire,
	asyncRequireAll,
	asyncRequireAny,
} from '@/js/util/async';

/**
 * Requires the Reader Revenue Manager setup success notification to be showing.
 *
 * @since n.e.x.t
 *
 * @return {function(): Promise<boolean>} Whether the setup success notification is being shown or not.
 */
function requireShowingSetupSuccessNotification() {
	return asyncRequireAll(
		requireQueryArg( 'notification', 'authentication_success' ),
		requireQueryArg( 'slug', MODULE_SLUG_READER_REVENUE_MANAGER )
	);
}

/**
 * Requires the publication onboarding state to have just changed.
 *
 * As a side effect, the changed flag is reset and the settings are saved when
 * it is set, so that the publication approved overlay is not shown again for
 * this reason.
 *
 * @since n.e.x.t
 *
 * @return {function(): Promise<boolean>} Whether the publication onboarding state has just changed or not.
 */
function requirePublicationOnboardingStateChanged() {
	return async ( { resolveSelect, dispatch } ) => {
		const { publicationOnboardingStateChanged } =
			( await resolveSelect(
				MODULES_READER_REVENUE_MANAGER
			).getSettings() ) || {};

		if ( publicationOnboardingStateChanged !== true ) {
			return false;
		}

		const { saveSettings, setPublicationOnboardingStateChanged } = dispatch(
			MODULES_READER_REVENUE_MANAGER
		);

		setPublicationOnboardingStateChanged( false );
		saveSettings();

		return true;
	};
}

/**
 * Requires the conditions for showing a product ID notification to be met.
 *
 * The publication must be onboarded and offer at least one product, while its
 * default `openaccess` product ID must still be the selected one.
 *
 * @since n.e.x.t
 *
 * @param {string} paymentOption Payment option the notification is for.
 * @return {function(): Promise<boolean>} Whether the product ID notification should be shown or not.
 */
function requireProductIDNotification( paymentOption ) {
	return asyncRequireAll(
		requireModuleActive( MODULE_SLUG_READER_REVENUE_MANAGER ),
		requirePublicationOnboardingState(
			PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		),
		requireProductIDs(),
		requireProductID( 'openaccess' ),
		requirePaymentOption( paymentOption )
	);
}

export const NOTIFICATIONS = {
	[ RRM_SETUP_NOTIFICATION_ID ]: {
		Component: ReaderRevenueManagerSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			// The prompt with the legacy key, used before the banner was
			// refactored to use the notification ID as its dismissal key, must
			// not be dismissed.
			asyncRequire(
				false,
				requirePromptDismissed( LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY )
			),
			requireModuleNotConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			requireCanActivateModule( MODULE_SLUG_READER_REVENUE_MANAGER )
		),
		isDismissible: true,
		dismissRetries: 1,
	},
	[ RRM_SETUP_SUCCESS_NOTIFICATION_ID ]: {
		Component: RRMSetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			requireShowingSetupSuccessNotification(),
			// The publication onboarding state must have been synced.
			asyncRequire(
				false,
				requirePublicationOnboardingState( undefined )
			)
		),
		isDismissible: false,
	},
	[ RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID ]: {
		Component: ProductIDContributionsNotification,
		priority: 20,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: requireProductIDNotification( 'contributions' ),
	},
	[ RRM_PRODUCT_ID_SUBSCRIPTIONS_NOTIFICATION_ID ]: {
		Component: ProductIDSubscriptionsNotification,
		priority: 20,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: requireProductIDNotification( 'subscriptions' ),
	},
	[ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION ]: {
		Component: PublicationApprovedOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			requirePublicationOnboardingState(
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
			),
			asyncRequireAny(
				// This check resets the changed flag as a side effect, so it
				// has to run whenever the onboarding state is complete, ahead
				// of the alternative below.
				requirePublicationOnboardingStateChanged(),
				// Setup has just been completed but no payment option has been
				// selected yet.
				asyncRequireAll(
					requireShowingSetupSuccessNotification(),
					requirePaymentOption( '' )
				)
			)
		),
	},
	[ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ]: {
		Component: RRMIntroductoryOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			asyncRequire( false, requireShowingSetupSuccessNotification() ),
			requirePublicationOnboardingState(
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
			),
			asyncRequireAny(
				requirePaymentOption( 'noPayment' ),
				requirePaymentOption( '' )
			),
			asyncRequire(
				false,
				requireContentPolicyState( EXTREME_POLICY_VIOLATION_STATES )
			)
		),
	},
	[ RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID ]: {
		Component: PolicyViolationNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			asyncRequire( false, requireShowingSetupSuccessNotification() ),
			// Show for pending or active violation states (not extreme).
			asyncRequire(
				false,
				requireContentPolicyState( EXTREME_POLICY_VIOLATION_STATES )
			),
			requireContentPolicyState( POLICY_VIOLATION_STATES )
		),
	},
	[ RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID ]: {
		Component: PolicyViolationNotification,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		dismissRetries: 5,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER ),
			asyncRequire( false, requireShowingSetupSuccessNotification() ),
			// Due to the addition of the `dismissRetries` property, the notification dismissal
			// logic uses prompts instead of items to track the dismissal status.
			// However, it is possible that the notification is dismissed using dismissed items
			// at the setup success notification stage.
			asyncRequire(
				false,
				requireItemDismissed(
					RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID
				)
			),
			// Show only for EXTREME severity.
			requireContentPolicyState( EXTREME_POLICY_VIOLATION_STATES )
		),
	},
	[ RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID ]: {
		Component: ExpressSetupResumeNewsletterNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		featureFlag: 'rrmExpressSetup',
		isDismissible: true,
		checkRequirements: async ( registry ) =>
			await checkRequirementsForExpressSetupResumeNotification(
				registry,
				EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
			),
	},
};

export function registerNotifications( notificationsAPI ) {
	createRegisterNotifications( notificationsAPI, NOTIFICATIONS );
}
