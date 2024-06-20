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
import { createPaxConfig } from './config';
import { PAX_GLOBAL_CONFIG } from './constants';

function makeGlobal( config ) {
	return { [ PAX_GLOBAL_CONFIG ]: config };
}

describe( 'PAX config', () => {
	describe( 'createPaxConfig', () => {
		it( 'requires the base config to be set on the expected global', () => {
			expect( () => createPaxConfig( { _global: {} } ) ).toThrow(
				'base PAX config must be a plain object'
			);
		} );

		it( 'returns the global config', () => {
			const config = createPaxConfig( {
				_global: makeGlobal( { foo: 'bar' } ),
			} );

			expect( config ).toEqual( { foo: 'bar' } );
		} );

		it( 'includes the contentContainer when provided', () => {
			const config = createPaxConfig( {
				contentContainer: '#testContainer',
				_global: makeGlobal( { foo: 'bar' } ),
			} );

			expect( config ).toEqual( {
				clientConfig: {
					contentContainer: '#testContainer',
				},
				foo: 'bar',
			} );
		} );

		it( 'includes the reportingStyle when provided', () => {
			const config = createPaxConfig( {
				reportingStyle: 'REPORTING_STYLE_FULL',
				_global: makeGlobal( { foo: 'bar' } ),
			} );

			expect( config ).toEqual( {
				contentConfig: {
					partnerAdsExperienceConfig: {
						reportingStyle: 'REPORTING_STYLE_FULL',
					},
				},
				foo: 'bar',
			} );
		} );
	} );
} );
