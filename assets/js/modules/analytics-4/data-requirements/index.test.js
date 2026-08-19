/**
 * Analytics 4 data requirements tests.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import { requireAdSenseLinked } from './index';

describe( 'analytics-4 data requirements', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'requireAdSenseLinked', () => {
		it( 'should return true when AdSense is linked', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetSettings( { adSenseLinked: true } );

			expect( await requireAdSenseLinked()( registry ) ).toBe( true );
		} );

		it( 'should return false when AdSense is not linked', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetSettings( { adSenseLinked: false } );

			expect( await requireAdSenseLinked()( registry ) ).toBe( false );
		} );

		it( 'should return false when the linked state is not available', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			expect( await requireAdSenseLinked()( registry ) ).toBe( false );
		} );
	} );
} );
