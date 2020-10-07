/**
 * `modules/adsense` data store: settings tests.
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
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
} from '../util/status';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';

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

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'saveUseSnippet', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					fetchMock.postOnce(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/,
						{ body: JSON.stringify( true ), status: 200 }
					);
					// Ensure initial settings from server are present.
					registry.dispatch( STORE_NAME ).receiveGetSettings( { useSnippet: false } );

					registry.dispatch( STORE_NAME ).setUseSnippet( true );
					await registry.dispatch( STORE_NAME ).saveUseSnippet();
				} ).not.toThrow();
			} );

			it( 'updates useSnippet setting from server', async () => {
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/,
					{ body: JSON.stringify( true ), status: 200 }
				);

				// Update setting and ensure this flags a settings change.
				registry.dispatch( STORE_NAME ).setUseSnippet( true );
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( true );

				await registry.dispatch( STORE_NAME ).saveUseSnippet();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Ensure settings now no longer need to be updated because
				// server-side and client-side settings now match.
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
			} );
		} );

		describe( 'fetchSaveUseSnippet', () => {
			it( 'requires the useSnippet param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchSaveUseSnippet();
				} ).toThrow( 'useSnippet is required.' );
			} );

			it( 'sets isDoingSaveUseSnippet', () => {
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/,
					{ body: JSON.stringify( true ), status: 200 }
				);

				registry.dispatch( STORE_NAME ).fetchSaveUseSnippet( true );
				expect( registry.select( STORE_NAME ).isDoingSaveUseSnippet() ).toEqual( true );
			} );
		} );

		describe( 'receiveSaveUseSnippet', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveSaveUseSnippet();
				} ).toThrow( 'response is required.' );
			} );

			it( 'requires the params param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveSaveUseSnippet( true );
				} ).toThrow( 'params is required.' );
			} );

			it( 'receives useSnippet and integrates into settings store', () => {
				// Simulate having loaded settings (useSnippet as false).
				registry.dispatch( STORE_NAME ).receiveGetSettings( {
					useSnippet: false,
					accountStatus: 'test-status',
				} );
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toBe( false );

				// Simulate having saved useSnippet as true.
				registry.dispatch( STORE_NAME ).receiveSaveUseSnippet( true, { useSnippet: true } );

				// getUseSnippet comes from settings store. Account status should be unmodified.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toBe( true );
				expect( registry.select( STORE_NAME ).getAccountStatus() ).toEqual( 'test-status' );
			} );

			it( 'receives and sets useSnippet from parameter', () => {
				registry.dispatch( STORE_NAME ).setUseSnippet( true );

				// Fake a request saving the useSnippet as false.
				registry.dispatch( STORE_NAME ).receiveSaveUseSnippet( true, { useSnippet: false } );

				// Make sure the saved false is now in place.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toBe( false );
			} );
		} );

		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
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
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
					{ body: wpError, status: 500 }
				);
				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( registry.select( STORE_NAME ).getSettings() ).toEqual( validSettings );
				expect( registry.select( STORE_NAME ).getErrorForAction( 'submitChanges' ) ).toEqual( wpError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates AdSense API cache on success', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				const cacheKey = createCacheKey( 'modules', 'adsense', 'arbitrary-datapoint' );
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).toEqual( 'test-value' );

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );

		describe( 'receiveOriginalAccountStatus', () => {
			it( 'requires the originalAccountStatus param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveOriginalAccountStatus();
				} ).toThrow( 'originalAccountStatus is required.' );
			} );

			it( 'receives and sets originalAccountStatus from parameter', () => {
				registry.dispatch( STORE_NAME ).receiveOriginalAccountStatus( 'something' );
				expect( registry.select( STORE_NAME ).getOriginalAccountStatus() ).toEqual( 'something' );
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
			it( 'requires a valid accountID or empty string', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setAccountID( '0' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );

				registry.dispatch( STORE_NAME ).setAccountID( null );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );

				// An empty string is accepted (for when no account can be determined).
				registry.dispatch( STORE_NAME ).setAccountID( '' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );

			it( 'requires a valid clientID or empty string', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setClientID( '0' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );

				registry.dispatch( STORE_NAME ).setClientID( null );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );

				// An empty string is accepted (for when no client can be determined).
				registry.dispatch( STORE_NAME ).setClientID( '' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );
		} );

		describe( 'getOriginalAccountStatus', () => {
			it( 'uses a resolver to make a network request via getSettings', async () => {
				const response = { accountStatus: 'some-status' };
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/,
					{ body: response, status: 200 }
				);

				const initialOriginalAccountStatus = registry.select( STORE_NAME ).getOriginalAccountStatus();
				// Settings will be their initial value while being fetched.
				expect( initialOriginalAccountStatus ).toEqual( undefined );

				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'getOriginalAccountStatus' ) && registry.select( STORE_NAME ).hasFinishedResolution( 'getSettings' ) );

				const originalAccountStatus = registry.select( STORE_NAME ).getOriginalAccountStatus();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( originalAccountStatus ).toEqual( response.accountStatus );
			} );

			it( 'does not make a network request if original account status is already set', async () => {
				const value = 'a-status';
				registry.dispatch( STORE_NAME ).receiveOriginalAccountStatus( value );

				expect( registry.select( STORE_NAME ).getOriginalAccountStatus() ).toEqual( value );

				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'getOriginalAccountStatus' ) );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not override original account status when receiving settings again', async () => {
				// Set original value.
				const value = 'a-status';
				registry.dispatch( STORE_NAME ).receiveOriginalAccountStatus( value );

				expect( registry.select( STORE_NAME ).getOriginalAccountStatus() ).toEqual( value );

				// Despite receiving settings, the value should not be updated
				// as it was already set.
				registry.dispatch( STORE_NAME ).receiveGetSettings( { accountStatus: 'another-status' } );
				expect( registry.select( STORE_NAME ).getOriginalAccountStatus() ).toEqual( value );
			} );
		} );
	} );
} );
