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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
	RRM_SETUP_SUCCESS_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	CONTENT_POLICY_STATES,
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistry, provideModules } from '@tests/js/test-utils';
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
	describe( 'rrm-express-setup-resume-newsletter-notification', () => {
		const { checkRequirements } =
			NOTIFICATIONS[
				RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID
			];

		function provideExpressSetupSettings( {
			configuredCTAs,
			lastActionedExpressSetups,
		} ) {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { configuredCTAs } );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetUserSettings( { lastActionedExpressSetups } );
		}

		it( 'should be active when the CTA was actioned but is not configured', async () => {
			provideExpressSetupSettings( {
				configuredCTAs: {},
				lastActionedExpressSetups: {
					[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 1752451200,
				},
			} );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the CTA action timestamp is falsy', async () => {
			provideExpressSetupSettings( {
				configuredCTAs: {},
				lastActionedExpressSetups: {
					[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 0,
				},
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the CTA is already configured', async () => {
			provideExpressSetupSettings( {
				configuredCTAs: {
					'configured-cta-id': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				},
				lastActionedExpressSetups: {
					[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 1752451200,
				},
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should only evaluate the requested CTA type', async () => {
			provideExpressSetupSettings( {
				configuredCTAs: {
					'configured-cta-id': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				},
				lastActionedExpressSetups: { 'another-cta': 1752451200 },
			} );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not request the module settings when the CTA was not actioned', async () => {
			// Only the user settings are provided, so a settings request would
			// be issued if the checks ran out of order.
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetUserSettings( { lastActionedExpressSetups: {} } );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
} );
