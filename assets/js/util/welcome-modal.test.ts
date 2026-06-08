/**
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import { isInitialWelcomeModalActive } from './welcome-modal';

describe( 'welcomeModal', () => {
	describe( 'isInitialWelcomeModalActive', () => {
		mockLocation();

		it( 'should return true when notification is "initial_setup_success"', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=initial_setup_success';

			expect( isInitialWelcomeModalActive() ).toBe( true );
		} );

		it( 'should return false when notification is not "initial_setup_success"', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=authentication_success';

			expect( isInitialWelcomeModalActive() ).toBe( false );
		} );

		it( 'should return false when notification is undefined', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';

			expect( isInitialWelcomeModalActive() ).toBe( false );
		} );
	} );
} );
