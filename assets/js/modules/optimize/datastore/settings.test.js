/**
 * `modules/optimize` data store: settings tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import API from 'googlesitekit-api';
import { MODULES_OPTIMIZE } from './constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';
import {
	INVARIANT_INVALID_AMP_EXPERIMENT_JSON,
	INVARIANT_INVALID_OPTIMIZE_ID,
} from './settings';

describe( 'modules/optimize settings', () => {
	let registry;

	const validSettings = {
		optimizeID: 'OPT-1234567',
		ampExperimentJSON: '',
	};
	const wpError = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setSettings( validSettings );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/optimize/data/settings'
					),
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( MODULES_OPTIMIZE ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/optimize/data/settings'
					),
					{
						body: {
							data: validSettings,
						},
					}
				);
				expect(
					registry.select( MODULES_OPTIMIZE ).haveSettingsChanged()
				).toBe( false );
			} );

			it( 'handles an error if set while saving settings', async () => {
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setSettings( validSettings );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/optimize/data/settings'
					),
					{ body: wpError, status: 500 }
				);
				await registry.dispatch( MODULES_OPTIMIZE ).submitChanges();

				expect(
					registry.select( MODULES_OPTIMIZE ).getSettings()
				).toEqual( validSettings );
				expect(
					registry
						.select( MODULES_OPTIMIZE )
						.getErrorForAction( 'submitChanges' )
				).toEqual( wpError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates Optimize API cache on success', async () => {
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setSettings( validSettings );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/optimize/data/settings'
					),
					{ body: validSettings, status: 200 }
				);

				const cacheKey = createCacheKey(
					'modules',
					'optimize',
					'arbitrary-datapoint'
				);
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).toEqual(
					'test-value'
				);

				await registry.dispatch( MODULES_OPTIMIZE ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', () => {
				expect(
					registry.select( MODULES_OPTIMIZE ).isDoingSubmitChanges()
				).toBe( false );

				registry.dispatch( MODULES_OPTIMIZE ).submitChanges();
				expect(
					registry.select( MODULES_OPTIMIZE ).isDoingSubmitChanges()
				).toBe( true );
			} );

			it( 'toggles the internal state again once submission is completed', async () => {
				const submitPromise = registry
					.dispatch( MODULES_OPTIMIZE )
					.submitChanges();
				expect(
					registry.select( MODULES_OPTIMIZE ).isDoingSubmitChanges()
				).toBe( true );

				await submitPromise;

				expect(
					registry.select( MODULES_OPTIMIZE ).isDoingSubmitChanges()
				).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid ampExperimentJSON or empty string', () => {
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setSettings( validSettings );
				expect(
					registry.select( MODULES_OPTIMIZE ).canSubmitChanges()
				).toBe( true );

				registry
					.dispatch( MODULES_OPTIMIZE )
					.setAMPExperimentJSON( 10 );
				expect( () =>
					registry
						.select( MODULES_OPTIMIZE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_AMP_EXPERIMENT_JSON );

				registry
					.dispatch( MODULES_OPTIMIZE )
					.setAMPExperimentJSON( null );
				expect(
					registry.select( MODULES_OPTIMIZE ).canSubmitChanges()
				).toBe( true );

				// An empty string is accepted (for when no ampExperimentJSON can be determined).
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setAMPExperimentJSON( '' );
				expect(
					registry.select( MODULES_OPTIMIZE ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'requires a valid optimizeID or empty string', () => {
				registry
					.dispatch( MODULES_OPTIMIZE )
					.setSettings( validSettings );
				expect(
					registry.select( MODULES_OPTIMIZE ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( '0' );
				expect( () =>
					registry
						.select( MODULES_OPTIMIZE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_OPTIMIZE_ID );

				registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( null );
				expect( () =>
					registry
						.select( MODULES_OPTIMIZE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_OPTIMIZE_ID );

				// An empty string is accepted (for when no optimize container ID can be determined).
				registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( '' );
				expect(
					registry.select( MODULES_OPTIMIZE ).canSubmitChanges()
				).toBe( true );
			} );
		} );
	} );
} );
