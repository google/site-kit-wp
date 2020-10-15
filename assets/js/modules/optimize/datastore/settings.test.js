/**
 * `modules/optimize` data store: settings tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';
import {
	INVARIANT_INVALID_AMP_EXPIREMENT_JSON, INVARIANT_INVALID_OPTIMIZE_ID,
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
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/optimize\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/optimize\/data\/settings/,
					{
						body: {
							data: validSettings,
						},
					}
				);
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
			} );

			it( 'handles an error if set while saving settings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/optimize\/data\/settings/,
					{ body: wpError, status: 500 }
				);
				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( registry.select( STORE_NAME ).getSettings() ).toEqual( validSettings );
				expect( registry.select( STORE_NAME ).getErrorForAction( 'submitChanges' ) ).toEqual( wpError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates Optimize API cache on success', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/optimize\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				const cacheKey = createCacheKey( 'modules', 'optimize', 'arbitrary-datapoint' );
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).toEqual( 'test-value' );

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', () => {
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );

				registry.dispatch( STORE_NAME ).submitChanges();
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );
			} );

			it( 'toggles the internal state again once submission is completed', async () => {
				const submitPromise = registry.dispatch( STORE_NAME ).submitChanges();
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );

				await submitPromise;

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid ampExperimentJSON or empty string', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setAMPExperimentJSON( 10 );
				expect( () => registry.select( STORE_NAME ).__dangerousCanSubmitChanges() )
					.toThrow( INVARIANT_INVALID_AMP_EXPIREMENT_JSON );

				registry.dispatch( STORE_NAME ).setAMPExperimentJSON( null );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				// An empty string is accepted (for when no ampExperimentJSON can be determined).
				registry.dispatch( STORE_NAME ).setAMPExperimentJSON( '' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );

			it( 'requires a valid optimizeID or empty string', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setOptimizeID( '0' );
				expect( () => registry.select( STORE_NAME ).__dangerousCanSubmitChanges() )
					.toThrow( INVARIANT_INVALID_OPTIMIZE_ID );

				registry.dispatch( STORE_NAME ).setOptimizeID( null );
				expect( () => registry.select( STORE_NAME ).__dangerousCanSubmitChanges() )
					.toThrow( INVARIANT_INVALID_OPTIMIZE_ID );

				// An empty string is accepted (for when no optimize ID can be determined).
				registry.dispatch( STORE_NAME ).setOptimizeID( '' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );
		} );
	} );
} );
