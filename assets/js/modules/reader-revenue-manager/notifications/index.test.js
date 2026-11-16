/**
 * Reader Revenue Manager module notification registration tests.
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
import {
	ALL_SERVICES_TAB_PATH,
	WHATS_NEW_TAB_PATH,
} from '@/js/components/feature-discovery/constants';
import { isFeatureEnabled } from '@/js/features';
import {
	VIEW_CONTEXT_FEATURE_DISCOVERY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION } from '@/js/modules/reader-revenue-manager/components/dashboard/PublicationApprovedOverlayNotification';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_FEATURE_DISCOVERY_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION_ID,
	RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION_ID,
	RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
	RRM_SETUP_SUCCESS_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	CONTENT_POLICY_STATES,
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	setEnabledFeatures,
} from '@tests/js/test-utils';
import { NOTIFICATIONS } from './index';

const SETUP_SUCCESS_URL = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_READER_REVENUE_MANAGER }`;

describe( 'Reader Revenue Manager notifications checkRequirements', () => {
	let registry;
	let oldLocation;

	beforeAll( () => {
		oldLocation = global.location;
		delete global.location;
		global.location = { href: 'http://example.com/wp-admin/admin.php' };
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		global.location.href = 'http://example.com/wp-admin/admin.php';

		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );
	} );

	describe( 'setup-success-notification-rrm', () => {
		const { checkRequirements } =
			NOTIFICATIONS[ RRM_SETUP_SUCCESS_NOTIFICATION_ID ];

		function provideOnboardingState(
			publicationOnboardingState = PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { publicationOnboardingState } );
		}

		it( 'should be active when the module has just been set up', async () => {
			provideOnboardingState();
			global.location.href = SETUP_SUCCESS_URL;

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			] );

			provideOnboardingState();
			global.location.href = SETUP_SUCCESS_URL;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the setup success notification is not being shown', async () => {
			provideOnboardingState();

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is for another module', async () => {
			provideOnboardingState();
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success&slug=analytics-4';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the publication onboarding state is undefined', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {} );

			global.location.href = SETUP_SUCCESS_URL;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
	describe( 'rrm-policy-violation-moderate-high-notification', () => {
		const { checkRequirements } =
			NOTIFICATIONS[ RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID ];

		function provideContentPolicyState( contentPolicyState ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { contentPolicyState } );
		}

		it.each( [
			[
				'grace period',
				CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
			],
			[
				'organization grace period',
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
			],
			[ 'active', CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE ],
			[
				'organization active',
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
			],
		] )(
			'should be active for the %s content policy state',
			async ( _, contentPolicyState ) => {
				provideContentPolicyState( contentPolicyState );

				expect( await checkRequirements( registry ) ).toBe( true );
			}
		);

		it( 'should not be active for the extreme content policy state', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when there is no policy violation', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_STATE_OK
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			] );

			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active while the setup success notification is showing', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE
			);

			global.location.href = SETUP_SUCCESS_URL;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
	describe( 'rrm-policy-violation-extreme-notification', () => {
		const { checkRequirements } =
			NOTIFICATIONS[ RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID ];

		function provideContentPolicyState( contentPolicyState ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { contentPolicyState } );
		}

		beforeEach( () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		} );

		it( 'should be active for the extreme content policy state', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
			);

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active for a non-extreme policy violation', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			] );

			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active while the setup success notification is showing', async () => {
			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
			);

			global.location.href = SETUP_SUCCESS_URL;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the notification was dismissed as an item', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
				] );

			provideContentPolicyState(
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
			);

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
	describe.each( [
		[
			RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION_ID,
			WHATS_NEW_TAB_PATH,
			ALL_SERVICES_TAB_PATH,
		],
		[
			RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION_ID,
			ALL_SERVICES_TAB_PATH,
			WHATS_NEW_TAB_PATH,
		],
	] )( '%s', ( notificationID, returnTab, otherTab ) => {
		const { checkRequirements } = NOTIFICATIONS[ notificationID ];

		function providePendingSetup( pendingSetup ) {
			registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.receivePendingSetup( pendingSetup );
		}

		function provideOnboardingState(
			publicationOnboardingState = PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			paymentOption = 'subscriptions'
		) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState,
					paymentOption,
				} );
		}

		it( 'should not be active when there is no pending setup', async () => {
			provideOnboardingState();
			providePendingSetup( null );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the pending feature is not Reader Revenue Manager (full setup)', async () => {
			provideOnboardingState();
			providePendingSetup( {
				featureSlug: 'newsletter-signup',
				returnTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the user returned to the other tab', async () => {
			provideOnboardingState();
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab: otherTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			] );
			provideOnboardingState();
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the publication onboarding state is undefined', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {} );
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should be active when the user has returned to the tab from Reader Revenue Manager (full setup)', async () => {
			provideOnboardingState();
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the publication is approved with no payment option chosen, so the "Publication approved" overlay can take the slot instead', async () => {
			provideOnboardingState(
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
				''
			);
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'feature-discovery-rrm-publication-approved-overlay', () => {
		const { checkRequirements } =
			NOTIFICATIONS[
				RRM_FEATURE_DISCOVERY_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION_ID
			];

		function providePendingSetup( pendingSetup ) {
			registry
				.dispatch( CORE_FEATURE_DISCOVERY )
				.receivePendingSetup( pendingSetup );
		}

		function provideApprovedNoPaymentOption( extraSettings = {} ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					paymentOption: '',
					...extraSettings,
				} );
		}

		it( 'should not be active when there is no pending setup', async () => {
			provideApprovedNoPaymentOption();
			providePendingSetup( null );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the pending feature is not Reader Revenue Manager (full setup)', async () => {
			provideApprovedNoPaymentOption();
			providePendingSetup( {
				featureSlug: 'newsletter-signup',
				returnTab: WHATS_NEW_TAB_PATH,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it.each( [ [ WHATS_NEW_TAB_PATH ], [ ALL_SERVICES_TAB_PATH ] ] )(
			'should be active regardless of which tab the user returned to (%s)',
			async ( returnTab ) => {
				provideApprovedNoPaymentOption();
				providePendingSetup( {
					featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
					returnTab,
				} );

				expect( await checkRequirements( registry ) ).toBe( true );
			}
		);

		it( 'should not be active when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: false,
				},
			] );
			provideApprovedNoPaymentOption();
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab: WHATS_NEW_TAB_PATH,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when a payment option has been chosen', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					paymentOption: 'subscriptions',
				} );
			providePendingSetup( {
				featureSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				returnTab: WHATS_NEW_TAB_PATH,
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active merely because the publication onboarding state changed, without a hub return - that trigger stays dashboard-only', async () => {
			provideApprovedNoPaymentOption( {
				publicationOnboardingStateChanged: true,
			} );
			providePendingSetup( null );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'Feature Discovery hub registrations', () => {
		it( 'should use notification IDs distinct from the dashboard registrations', () => {
			expect(
				RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION_ID
			).not.toBe( RRM_SETUP_SUCCESS_NOTIFICATION_ID );
			expect(
				RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION_ID
			).not.toBe( RRM_SETUP_SUCCESS_NOTIFICATION_ID );
			expect(
				RRM_FEATURE_DISCOVERY_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION_ID
			).not.toBe( RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION );
		} );

		it( 'should register each hub notification independently, scoped to the Feature Discovery view context and non-persistently dismissible', () => {
			[
				RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION_ID,
				RRM_FEATURE_DISCOVERY_SETUP_SUCCESS_ALL_SERVICES_NOTIFICATION_ID,
				RRM_FEATURE_DISCOVERY_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION_ID,
			].forEach( ( notificationID ) => {
				expect( NOTIFICATIONS[ notificationID ] ).toMatchObject( {
					viewContexts: [ VIEW_CONTEXT_FEATURE_DISCOVERY ],
					isDismissible: false,
				} );
			} );

			// The dashboard registrations are untouched by the above.
			expect(
				NOTIFICATIONS[ RRM_SETUP_SUCCESS_NOTIFICATION_ID ].viewContexts
			).toEqual( [ VIEW_CONTEXT_MAIN_DASHBOARD ] );
			expect(
				NOTIFICATIONS[ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION ]
					.viewContexts
			).toEqual( [ VIEW_CONTEXT_MAIN_DASHBOARD ] );
		} );
	} );

	describe( 'main dashboard notifications with RRM inactive', () => {
		it( 'should not request the user settings or log an error when the `rrmExpressSetup` feature is enabled', async () => {
			setEnabledFeatures( [ 'rrmExpressSetup' ] );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: false,
					connected: false,
				},
			] );

			const mainDashboardNotifications = Object.values(
				NOTIFICATIONS
			).filter(
				( { viewContexts, featureFlag } ) =>
					viewContexts.includes( VIEW_CONTEXT_MAIN_DASHBOARD ) &&
					( ! featureFlag || isFeatureEnabled( featureFlag ) )
			);

			// Sanity check that the notifications under test were found.
			expect( mainDashboardNotifications.length ).toBeGreaterThan( 0 );

			await Promise.all(
				mainDashboardNotifications.map( ( { checkRequirements } ) =>
					checkRequirements( registry )
				)
			);

			expect( fetchMock ).not.toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
				)
			);
			expect( console ).not.toHaveErrored();
		} );
	} );
} );
