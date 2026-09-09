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
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_SETUP_SUCCESS_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
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
} );
