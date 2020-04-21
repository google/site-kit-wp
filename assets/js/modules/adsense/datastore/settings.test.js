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

describe( 'modules/adsense settings', () => {
	let apiFetchSpy;
	let registry;

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
		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( validSettings ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).submitChanges();

				await subscribeUntil(
					registry,
					() => registry.select( STORE_NAME ).isDoingSubmitChanges() === false
				);

				expect( fetch ).toHaveBeenCalled();
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toEqual( validSettings );
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
			} );

			it( 'handles an error if set while saving settings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/settings/
					)
					.mockResponseOnce(
						JSON.stringify( error ),
						{ status: 500 }
					);

				registry.dispatch( STORE_NAME ).submitChanges();

				await subscribeUntil(
					registry,
					() => registry.select( STORE_NAME ).isDoingSubmitChanges() === false
				);

				expect( registry.select( STORE_NAME ).getSettings() ).toEqual( validSettings );
				expect( registry.select( STORE_NAME ).getError() ).toEqual( error );
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
				registry.dispatch( STORE_NAME ).submitChanges();
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );

				await subscribeUntil( registry,
					() => registry.stores[ STORE_NAME ].store.getState().isDoingSubmitChanges === false
				);

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid accountID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setAccountID( '0' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid clientID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setClientID( '0' );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );
		} );
	} );
} );
