/**
 * modules/analytics data store: settings tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock-jest';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME, ACCOUNT_CREATE, PROPERTY_CREATE, PROFILE_CREATE } from './constants';
import * as fixtures from './__fixtures__';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
	muteConsole,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';

describe( 'modules/analytics settings', () => {
	fetchMock.config.fallbackToNetwork = true;
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
	const tagWithPermission = {
		accountID: '12345',
		propertyID: 'UA-12345-1',
		permission: true,
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
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		fetchMock.restore();
		fetchMock.mockClear();
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			// Receive empty settings to prevent unexpected fetch by resolver.
			registry.dispatch( STORE_NAME ).receiveSettings( {} );
		} );

		describe( 'submitChanges', () => {
			it( 'dispatches createProperty if the "set up a new property" option is chosen', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
				} );
				const createdProperty = {
					...fixtures.propertiesProfiles.properties[ 0 ],
					id: 'UA-12345-1',
					internalWebPropertyId: '123456789',
				};

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: createdProperty, status: 200 }
				);
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					( url, opts ) => {
						const { data } = JSON.parse( opts.body );
						return { body: data, status: 200 };
					}
				);

				const result = await registry.dispatch( STORE_NAME ).submitChanges();
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: { data: { accountID: '12345' } } },
				);

				expect( result.error ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( createdProperty.id );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( createdProperty.internalWebPropertyId );
			} );

			it( 'handles an error if set while creating a property', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: error, status: 500 }
				);

				muteConsole( 'error' );
				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: { data: { accountID: '12345' } } },
				);

				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( PROPERTY_CREATE );
				expect( registry.select( STORE_NAME ).getError() ).toEqual( error );
			} );

			it( 'dispatches createProfile if the "set up a new profile" option is chosen', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: 'UA-12345-1',
					profileID: PROFILE_CREATE,
				} );
				const createdProfile = {
					...fixtures.propertiesProfiles.profiles[ 0 ],
					id: '987654321',
				};
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: createdProfile, status: 200 }
				);
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					( url, opts ) => {
						const { data } = JSON.parse( opts.body );
						return { body: data, status: 200 };
					}
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{
						body: {
							data: {
								accountID: '12345',
								propertyID: 'UA-12345-1',
							},
						},
					},
				);

				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( createdProfile.id );
			} );

			it( 'handles an error if set while creating a profile', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: 'UA-12345-1',
					profileID: PROFILE_CREATE,
				} );

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: error, status: 500 }
				);

				muteConsole( 'error' );
				const result = await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: { data: { accountID: '12345', propertyID: 'UA-12345-1' } } },
				);
				expect( result.error ).toEqual( error );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( PROFILE_CREATE );
				expect( registry.select( STORE_NAME ).getError() ).toEqual( error );
			} );

			it( 'dispatches both createProperty and createProfile when selected', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
					profileID: PROFILE_CREATE,
				} );
				const createdProperty = {
					...fixtures.propertiesProfiles.properties[ 0 ],
					id: 'UA-12345-1',
				};
				const createdProfile = {
					...fixtures.propertiesProfiles.profiles[ 0 ],
					id: '987654321',
				};

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: createdProperty, status: 200 }
				);
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: createdProfile, status: 200 }
				);
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					( url, opts ) => {
						const { data } = JSON.parse( opts.body );
						return { body: data, status: 200 };
					}
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( createdProperty.id );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( createdProfile.id );
			} );

			it( 'dispatches saveSettings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).not.toHaveFetchedTimes( 0 );
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{ body: { data: validSettings } },
				);
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
			} );

			it( 'returns an error if saveSettings fails', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{ body: error, status: 500 }
				);

				muteConsole( 'error' );
				const result = await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{ body: { data: validSettings } },
				);
				expect( result.error ).toEqual( error );
			} );

			it( 'invalidates Analytics API cache on success', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				const cacheKey = createCacheKey( 'modules', 'analytics', 'arbitrary-datapoint' );
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', async () => {
				registry.dispatch( STORE_NAME ).receiveSettings( validSettings );
				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );

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
				registry.dispatch( STORE_NAME ).receiveTagPermission( tagWithPermission );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setAccountID( '0' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid propertyID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( STORE_NAME ).receiveTagPermission( tagWithPermission );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setPropertyID( '0' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid profileID', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( STORE_NAME ).receiveTagPermission( tagWithPermission );

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
				registry.dispatch( STORE_NAME ).receiveExistingTag( existingTag.propertyID );
				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					...existingTag,
					permission: true,
				} );
				expect( registry.select( STORE_NAME ).hasTagPermission( existingTag.propertyID ) ).toBe( true );
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					...existingTag,
					permission: false,
				} );
				expect( registry.select( STORE_NAME ).hasTagPermission( existingTag.propertyID ) ).toBe( false );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );

			it( 'supports creating a property', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( STORE_NAME ).setPropertyID( PROPERTY_CREATE );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );

			it( 'supports creating a profile', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( STORE_NAME ).setProfileID( PROFILE_CREATE );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );
			} );

			it( 'does not support creating an account', () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( STORE_NAME ).setAccountID( ACCOUNT_CREATE );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
			} );
		} );
	} );
} );
