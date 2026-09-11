/**
 * Ads module notification registration tests.
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
import { ENHANCED_CONVERSIONS_NOTIFICATION_ADS } from '@/js/modules/ads/components/notifications/EnhancedConversionsNotification';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from '@/js/modules/ads/pax/constants';
import { createTestRegistry, provideModules } from '@tests/js/test-utils';
import { ADS_NOTIFICATIONS } from './index';

describe( 'ADS_NOTIFICATIONS checkRequirements', () => {
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
	} );

	describe( 'setup-success-notification-ads', () => {
		const { checkRequirements } =
			ADS_NOTIFICATIONS[ 'setup-success-notification-ads' ];

		it( 'should be active when Ads has just been set up', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_ADS }`;

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the `notification` query arg is not set to `authentication_success`', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=other&slug=${ MODULE_SLUG_ADS }`;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is for another module', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success&slug=analytics-4';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is missing', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'setup-success-notification-pax', () => {
		const { checkRequirements } =
			ADS_NOTIFICATIONS[ 'setup-success-notification-pax' ];

		it( 'should be active when the PAX setup success query arg is present', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=${ PAX_SETUP_SUCCESS_NOTIFICATION }`;

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active for another `notification` query arg value', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `notification` query arg is missing', async () => {
			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );

	describe( 'enhanced conversions notification', () => {
		const { checkRequirements } =
			ADS_NOTIFICATIONS[ ENHANCED_CONVERSIONS_NOTIFICATION_ADS ];

		it( 'should be active when the Ads module is connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ADS,
					active: true,
					connected: true,
				},
			] );

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the Ads module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ADS,
					active: true,
					connected: false,
				},
			] );

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
} );
