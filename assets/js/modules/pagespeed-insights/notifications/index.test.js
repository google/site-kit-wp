/**
 * PageSpeed Insights notification registrations tests.
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
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import { NOTIFICATIONS } from './index';

describe( 'PageSpeed Insights NOTIFICATIONS checkRequirements', () => {
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

	describe( 'setup-success-notification-psi', () => {
		const { checkRequirements } =
			NOTIFICATIONS[ 'setup-success-notification-psi' ];

		it( 'should be active when the module has just been set up', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_PAGESPEED_INSIGHTS }`;

			expect( await checkRequirements( registry ) ).toBe( true );
		} );

		it( 'should not be active when the `notification` query arg is not set to `authentication_success`', async () => {
			global.location.href = `http://example.com/wp-admin/admin.php?notification=other&slug=${ MODULE_SLUG_PAGESPEED_INSIGHTS }`;

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is for another module', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success&slug=analytics-4';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );

		it( 'should not be active when the `slug` query arg is absent', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			expect( await checkRequirements( registry ) ).toBe( false );
		} );
	} );
} );
