/**
 * modules/adsense data store: settings tests.
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
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

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
	let apiFetchSpy;
	let registry;
	let dispatch;
	let select;

	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: true,
		accountStatus: ACCOUNT_STATUS_APPROVED,
		siteStatus: SITE_STATUS_ADDED,
	};
	const error = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		dispatch = registry.dispatch( STORE_NAME );
		select = registry.select( STORE_NAME );
		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'saveUseSnippet', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/
						)
						.mockResponseOnce(
							JSON.stringify( true ),
							{ status: 200 }
						);

					// Ensure initial settings from server are present.
					dispatch.receiveSettings( { useSnippet: false } );

					dispatch.setUseSnippet( true );
					await dispatch.saveUseSnippet();
				} ).not.toThrow();
			} );

			it( 'updates useSnippet setting from server', async () => {
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/
					)
					.mockResponse(
						JSON.stringify( true ),
						{ status: 200 }
					);

				// Update setting and ensure this flags a settings change.
				dispatch.setUseSnippet( true );
				expect( select.haveSettingsChanged() ).toBe( true );

				dispatch.saveUseSnippet();

				await subscribeUntil( registry, () => select.isDoingSaveUseSnippet() === false );

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				// Ensure settings now no longer need to be updated because
				// server-side and client-side settings now match.
				expect( select.haveSettingsChanged() ).toBe( false );
			} );
		} );

		describe( 'fetchSaveUseSnippet', () => {
			it( 'requires the useSnippet param', () => {
				const consoleErrorSpy = jest.spyOn( global.console, 'error' );

				dispatch.fetchSaveUseSnippet();
				expect( consoleErrorSpy ).toHaveBeenCalledWith( 'useSnippet is required.' );

				consoleErrorSpy.mockClear();
			} );

			it( 'sets isDoingSaveUseSnippet', () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/use-snippet/
					)
					.mockResponseOnce(
						JSON.stringify( true ),
						{ status: 200 }
					);

				dispatch.fetchSaveUseSnippet( true );
				expect( select.isDoingSaveUseSnippet() ).toEqual( true );
			} );
		} );

		describe( 'receiveSaveUseSnippet', () => {
			it( 'requires the response param', () => {
				expect( () => {
					dispatch.receiveSaveUseSnippet();
				} ).toThrow( 'response is required.' );
			} );

			it( 'requires the params param', () => {
				expect( () => {
					dispatch.receiveSaveUseSnippet( true );
				} ).toThrow( 'params is required.' );
			} );

			it( 'receives and sets useSnippet from parameter', () => {
				dispatch.setUseSnippet( true );

				// Fake a request saving the useSnippet as false.
				dispatch.receiveSaveUseSnippet( true, { useSnippet: false } );

				// Make sure the saved false is now in place.
				expect( select.getUseSnippet() ).toBe( false );
			} );
		} );

		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				dispatch.setSettings( validSettings );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( validSettings ),
						{ status: 200 }
					);

				dispatch.submitChanges();

				await subscribeUntil(
					registry,
					() => select.isDoingSubmitChanges() === false
				);

				expect( fetch ).toHaveBeenCalled();
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toEqual( validSettings );
				expect( select.haveSettingsChanged() ).toBe( false );
			} );

			it( 'handles an error if set while saving settings', async () => {
				dispatch.setSettings( validSettings );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( error ),
						{ status: 500 }
					);

				dispatch.submitChanges();

				await subscribeUntil(
					registry,
					() => select.isDoingSubmitChanges() === false
				);

				expect( select.getSettings() ).toEqual( validSettings );
				expect( select.getError() ).toEqual( error );
			} );

			it( 'invalidates AdSense API cache on success', async () => {
				dispatch.setSettings( validSettings );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( validSettings ),
						{ status: 200 }
					);

				const cacheKey = createCacheKey( 'modules', 'adsense', 'arbitrary-datapoint' );
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

				await dispatch.submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );

		describe( 'receiveOriginalAccountStatus', () => {
			it( 'requires the originalAccountStatus param', () => {
				expect( () => {
					dispatch.receiveOriginalAccountStatus();
				} ).toThrow( 'originalAccountStatus is required.' );
			} );

			it( 'receives and sets originalAccountStatus from parameter', () => {
				dispatch.receiveOriginalAccountStatus( 'something' );
				expect( select.getOriginalAccountStatus() ).toEqual( 'something' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', () => {
				expect( select.isDoingSubmitChanges() ).toBe( false );

				dispatch.submitChanges();
				expect( select.isDoingSubmitChanges() ).toBe( true );
			} );

			it( 'toggles the internal state again once submission is completed', async () => {
				dispatch.submitChanges();
				expect( select.isDoingSubmitChanges() ).toBe( true );

				await subscribeUntil( registry,
					() => registry.stores[ STORE_NAME ].store.getState().isDoingSubmitChanges === false
				);

				expect( select.isDoingSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid accountID', () => {
				dispatch.setSettings( validSettings );
				expect( select.canSubmitChanges() ).toBe( true );

				dispatch.setAccountID( '0' );
				expect( select.canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid clientID', () => {
				dispatch.setSettings( validSettings );
				expect( select.canSubmitChanges() ).toBe( true );

				dispatch.setClientID( '0' );
				expect( select.canSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'getOriginalAccountStatus', () => {
			it( 'uses a resolver to make a network request via getSettings', async () => {
				const response = { accountStatus: 'some-status' };
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 200 }
					);

				const initialOriginalAccountStatus = select.getOriginalAccountStatus();
				// Settings will be their initial value while being fetched.
				expect( initialOriginalAccountStatus ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.getOriginalAccountStatus() !== undefined
					),
				);

				const originalAccountStatus = select.getOriginalAccountStatus();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( originalAccountStatus ).toEqual( response.accountStatus );
			} );

			it( 'does not make a network request if original account status is already set', async () => {
				const value = 'a-status';
				dispatch.receiveOriginalAccountStatus( value );

				expect( select.getOriginalAccountStatus() ).toEqual( value );

				await subscribeUntil( registry, () => select.hasFinishedResolution( 'getOriginalAccountStatus' ) );

				expect( fetch ).not.toHaveBeenCalled();
			} );

			it( 'does not override original account status when receiving settings again', async () => {
				// Set original value.
				const value = 'a-status';
				dispatch.receiveOriginalAccountStatus( value );

				expect( select.getOriginalAccountStatus() ).toEqual( value );

				// Despite receiving settings, the value should not be updated
				// as it was already set.
				dispatch.receiveSettings( { accountStatus: 'another-status' } );
				expect( select.getOriginalAccountStatus() ).toEqual( value );
			} );
		} );
	} );
} );
