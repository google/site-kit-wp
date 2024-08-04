/**
 * `modules/adsense` data store: settings tests.
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
import { MODULES_ADSENSE } from './constants';
import { ACCOUNT_STATUS_APPROVED, SITE_STATUS_ADDED } from '../util/status';
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';
import {
	INVARIANT_INVALID_ACCOUNT_ID,
	INVARIANT_INVALID_CLIENT_ID,
} from './settings';

describe( 'modules/adsense settings', () => {
	let registry;

	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: true,
		accountStatus: ACCOUNT_STATUS_APPROVED,
		siteStatus: SITE_STATUS_ADDED,
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

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( validSettings );
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/settings'
					),
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( MODULES_ADSENSE ).submitChanges();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/settings'
					),
					{
						body: {
							data: validSettings,
						},
					}
				);
				expect(
					registry.select( MODULES_ADSENSE ).haveSettingsChanged()
				).toBe( false );
			} );

			it( 'handles an error if set while saving settings', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( validSettings );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/settings'
					),
					{ body: wpError, status: 500 }
				);
				await registry.dispatch( MODULES_ADSENSE ).submitChanges();

				expect(
					registry.select( MODULES_ADSENSE ).getSettings()
				).toEqual( validSettings );
				expect(
					registry
						.select( MODULES_ADSENSE )
						.getErrorForAction( 'submitChanges' )
				).toEqual( wpError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates AdSense API cache on success', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( validSettings );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/settings'
					),
					{ body: validSettings, status: 200 }
				);

				const cacheKey = createCacheKey(
					'modules',
					'adsense',
					'arbitrary-datapoint'
				);
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).toEqual(
					'test-value'
				);

				await registry.dispatch( MODULES_ADSENSE ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );

		describe( 'receiveOriginalUseSnippet', () => {
			it( 'requires the originalUseSnippet param', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ADSENSE )
						.receiveOriginalUseSnippet();
				} ).toThrow( 'originalUseSnippet is required.' );
			} );

			it( 'receives and sets originalUseSnippet from parameter', () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveOriginalUseSnippet( true );
				expect(
					registry.select( MODULES_ADSENSE ).getOriginalUseSnippet()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', () => {
				expect(
					registry.select( MODULES_ADSENSE ).isDoingSubmitChanges()
				).toBe( false );

				registry.dispatch( MODULES_ADSENSE ).submitChanges();
				expect(
					registry.select( MODULES_ADSENSE ).isDoingSubmitChanges()
				).toBe( true );
			} );

			it( 'toggles the internal state again once submission is completed', async () => {
				const submitPromise = registry
					.dispatch( MODULES_ADSENSE )
					.submitChanges();
				expect(
					registry.select( MODULES_ADSENSE ).isDoingSubmitChanges()
				).toBe( true );

				await submitPromise;

				expect(
					registry.select( MODULES_ADSENSE ).isDoingSubmitChanges()
				).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid accountID or empty string', () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( validSettings );
				expect(
					registry.select( MODULES_ADSENSE ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_ADSENSE ).setAccountID( '0' );
				expect( () =>
					registry
						.select( MODULES_ADSENSE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_ACCOUNT_ID );

				registry.dispatch( MODULES_ADSENSE ).setAccountID( null );
				expect( () =>
					registry
						.select( MODULES_ADSENSE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_ACCOUNT_ID );

				// An empty string is accepted (for when no account can be determined).
				registry.dispatch( MODULES_ADSENSE ).setAccountID( '' );
				expect(
					registry.select( MODULES_ADSENSE ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'requires a valid clientID or empty string', () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.setSettings( validSettings );
				expect(
					registry.select( MODULES_ADSENSE ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_ADSENSE ).setClientID( '0' );
				expect( () =>
					registry
						.select( MODULES_ADSENSE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_CLIENT_ID );

				registry.dispatch( MODULES_ADSENSE ).setClientID( null );
				expect( () =>
					registry
						.select( MODULES_ADSENSE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_CLIENT_ID );

				// An empty string is accepted (for when no client can be determined).
				registry.dispatch( MODULES_ADSENSE ).setClientID( '' );
				expect(
					registry.select( MODULES_ADSENSE ).canSubmitChanges()
				).toBe( true );
			} );
		} );

		describe( 'getOriginalUseSnippet', () => {
			it( 'uses a resolver to make a network request via getSettings', async () => {
				const response = { useSnippet: false };
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/settings'
					),
					{ body: response, status: 200 }
				);

				const initialOriginalUseSnippet = registry
					.select( MODULES_ADSENSE )
					.getOriginalUseSnippet();
				// Settings will be their initial value while being fetched.
				expect( initialOriginalUseSnippet ).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.hasFinishedResolution( 'getOriginalUseSnippet' ) &&
						registry
							.select( MODULES_ADSENSE )
							.hasFinishedResolution( 'getSettings' )
				);

				const originalUseSnippet = registry
					.select( MODULES_ADSENSE )
					.getOriginalUseSnippet();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( originalUseSnippet ).toBe( response.useSnippet );
			} );

			it( 'does not make a network request if original useSnippet is already set', async () => {
				const value = true;
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveOriginalUseSnippet( value );

				expect(
					registry.select( MODULES_ADSENSE ).getOriginalUseSnippet()
				).toBe( value );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getOriginalUseSnippet' )
				);

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not override original useSnippet when receiving settings again', () => {
				// Set original value.
				const value = true;
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveOriginalUseSnippet( value );

				expect(
					registry.select( MODULES_ADSENSE ).getOriginalUseSnippet()
				).toBe( value );

				// Despite receiving settings, the value should not be updated
				// as it was already set.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSettings( { useSnippet: false } );
				expect(
					registry.select( MODULES_ADSENSE ).getOriginalUseSnippet()
				).toBe( value );
			} );
		} );
	} );
} );
