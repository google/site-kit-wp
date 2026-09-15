/**
 * `core/feature-discovery` datastore test utilities tests.
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
import { createTestRegistry } from '@tests/js/utils';
import { CORE_FEATURE_DISCOVERY, FEATURE_EFFORTS } from './constants';
import { provideFeatures } from './test-utils';

describe( 'feature-discovery test utilities', () => {
	it( 'should provide features to the registry', () => {
		const registry = createTestRegistry();

		const features = [
			{ slug: 'first-feature', title: 'First feature' },
			{ slug: 'second-feature', effort: FEATURE_EFFORTS.HIGH },
		];

		provideFeatures( registry, features );

		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).getFeatures()
		).toMatchObject( features );

		expect(
			registry
				.select( CORE_FEATURE_DISCOVERY )
				.getFeature( 'first-feature' )
		).toMatchObject( features[ 0 ] );
	} );
} );
