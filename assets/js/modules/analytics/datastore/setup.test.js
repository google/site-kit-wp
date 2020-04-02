/**
 * modules/analytics data store: setup tests.
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
import { STORE_NAME } from '.';
import { PROPERTY_CREATE } from './properties';
import * as fixtures from './__fixtures__';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';

describe( 'modules/analytics setup', () => {
	let apiFetchSpy;
	let registry;

	const validSettings = {
		accountID: '12345',
		propertyID: 'UA-12345-1',
		internalWebPropertyID: '23245',
		profileID: '54321',
		useSnippet: true,
		trackingDisabled: [],
		anonymizeIP: true,
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
			it( 'dispatches createProperty if the "set up a new property" option is chosen', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
				} );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/
					)
					.mockResponseOnce(
						JSON.stringify( {
							...fixtures.propertiesProfiles.properties[ 0 ],
							id: 'UA-12345-1',
						} ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).submitChanges();

				await subscribeUntil(
					registry,
					() => registry.select( STORE_NAME ).isDoingSubmitChanges() === false
				);

				expect( fetch.mock.calls[ 0 ][ 0 ] ).toMatch( '/google-site-kit/v1/modules/analytics/data/create-property' );
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ) ).toMatchObject( {
					accountID: '12345',
				} );

				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( 'UA-12345-1' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', () => {
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );

				registry.dispatch( STORE_NAME ).startSubmitChanges();

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );
			} );

			it( 'toggles the internal state again once submission is completed', () => {
				registry.dispatch( STORE_NAME ).startSubmitChanges();

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).finishSubmitChanges();

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

			it( 'requires a valid propertyID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setPropertyID( '0' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid profileID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setProfileID( '0' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'requires permissions for an existing tag', () => {
				const existingTag = {
					accountID: '999999',
					propertyID: 'UA-999999-1',
				};
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					...existingTag, // Set automatically in resolver.
				} );
				registry.dispatch( STORE_NAME ).receiveExistingTag( existingTag );
				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					...existingTag,
					permission: true,
				} );
				expect( registry.select( STORE_NAME ).hasTagPermission( 'UA-999999-1' ) ).toBe( true );

				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					...existingTag,
					permission: false,
				} );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );
		} );
	} );
} );
