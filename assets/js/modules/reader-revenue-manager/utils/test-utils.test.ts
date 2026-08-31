/**
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
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistry } from '@tests/js/utils';
import { providePublications } from './test-utils';

describe( 'test utilities', () => {
	describe( 'providePublications', () => {
		let registry: Registry;

		beforeEach( () => {
			registry = createTestRegistry() as Registry;
		} );

		it( 'should provide publications', () => {
			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications()
			).toBeUndefined();

			providePublications( registry, publications );

			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.hasFinishedResolution( 'getPublications' )
			).toBe( true );

			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications().length
			).toBe( publications.length );
		} );
	} );
} );
