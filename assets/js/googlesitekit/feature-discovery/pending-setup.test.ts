/**
 * Feature Discovery pending setup tests.
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
import { type Registry, type Select } from 'googlesitekit-data';
import { getItem } from '@/js/googlesitekit/api/cache';
import { createTestRegistry, provideSiteInfo } from '@tests/js/test-utils';
import {
	FEATURE_DISCOVERY_SETUP_CACHE_KEY,
	consumePendingSetup,
	getPendingSetupReturnURL,
	setPendingSetup,
} from './pending-setup';

describe( 'feature-discovery pending setup', () => {
	afterEach( async () => {
		global.history.replaceState( {}, '', '/' );
		await consumePendingSetup();
	} );

	describe( 'setPendingSetup and consumePendingSetup', () => {
		it( 'should return the stored record', async () => {
			await setPendingSetup( 'adsense', '/whats-new' );

			expect( await consumePendingSetup() ).toEqual( {
				featureSlug: 'adsense',
				returnTab: '/whats-new',
			} );
		} );

		it( 'should delete the record so it can only be consumed once', async () => {
			await setPendingSetup( 'adsense', '/whats-new' );

			await consumePendingSetup();

			expect( await consumePendingSetup() ).toBeNull();
			expect(
				( await getItem( FEATURE_DISCOVERY_SETUP_CACHE_KEY ) ).cacheHit
			).toBe( false );
		} );

		it( 'should return null when there is no record', async () => {
			expect( await consumePendingSetup() ).toBeNull();
		} );
	} );

	describe( 'getPendingSetupReturnURL', () => {
		let registry: Registry;

		beforeEach( () => {
			registry = createTestRegistry() as Registry;
			provideSiteInfo( registry );
		} );

		it( 'should return the hub URL when the record belongs to the feature', async () => {
			await setPendingSetup( 'adsense', '/whats-new' );

			const url = await getPendingSetupReturnURL(
				registry.select as Select,
				'adsense'
			);

			expect( url ).toBe(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-features'
			);
		} );

		it( 'should return undefined when the record belongs to another feature', async () => {
			await setPendingSetup( 'ads', '/whats-new' );

			expect(
				await getPendingSetupReturnURL(
					registry.select as Select,
					'adsense'
				)
			).toBeUndefined();
		} );

		it( 'should return undefined when there is no record', async () => {
			expect(
				await getPendingSetupReturnURL(
					registry.select as Select,
					'adsense'
				)
			).toBeUndefined();
		} );

		it( 'should not delete the record it reads', async () => {
			await setPendingSetup( 'adsense', '/whats-new' );

			await getPendingSetupReturnURL(
				registry.select as Select,
				'adsense'
			);

			expect(
				( await getItem( FEATURE_DISCOVERY_SETUP_CACHE_KEY ) ).cacheHit
			).toBe( true );
		} );
	} );
} );
