/**
 * `core/user` data store: user input settings tests.
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
import { createTestRegistry, subscribeUntil, unsubscribeFromAll } from '../../../../../tests/js/utils';
import { waitFor } from '../../../../../tests/js/test-utils';
import { STORE_NAME } from './constants';

describe( 'core/user user-input-settings', () => {
	let registry;
	let store;

	const coreUserInputSettingsEndpointRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/user-input-settings/;
	const coreUserInputSettingsExpectedResponse = {
		goals: {
			values: [ 'goal1', 'goal2' ],
			scope: 'site',
		},
		helpNeeded: {
			values: [ 'no' ],
			scope: 'site',
		},
		searchTerms: {
			values: [ 'keyword1' ],
			scope: 'site',
		},
		role: {
			values: [ 'admin' ],
			scope: 'user',
		},
		postFrequency: {
			values: [ 'daily' ],
			scope: 'user',
		},
	};
	const coreUserInputSettings = {
		goals: coreUserInputSettingsExpectedResponse.goals.values,
		helpNeeded: coreUserInputSettingsExpectedResponse.helpNeeded.values,
		searchTerms: coreUserInputSettingsExpectedResponse.searchTerms.values,
		role: coreUserInputSettingsExpectedResponse.role.values,
		postFrequency: coreUserInputSettingsExpectedResponse.postFrequency.values,
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		registry.dispatch( STORE_NAME ).receiveUserInputState( 'completed' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			registry.dispatch( STORE_NAME ).receiveGetUserInputSettings( coreUserInputSettingsExpectedResponse );
		} );

		describe( 'setUserInputSetting', () => {
			it( 'should correctly set new values for the setting', () => {
				const settingID = 'goals';
				const values = [
					'              goal3',
					'             goal4        ',
					'goal5            ',
					'goal6',
				];

				registry.dispatch( STORE_NAME ).setUserInputSetting( settingID, values );
				expect( store.getState() ).toMatchObject( {
					inputSettings: {
						...coreUserInputSettingsExpectedResponse,
						[ settingID ]: {
							...coreUserInputSettingsExpectedResponse[ settingID ],
							values: [ 'goal3', 'goal4', 'goal5', 'goal6' ],
						},
					},
				} );
			} );
		} );

		describe( 'saveUserInputSettings', () => {
			it( 'should save settings and add it to the store ', async () => {
				fetchMock.postOnce(
					coreUserInputSettingsEndpointRegExp,
					{ body: coreUserInputSettingsExpectedResponse, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).saveUserInputSettings( coreUserInputSettings );
				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( coreUserInputSettingsEndpointRegExp, {
					body: {
						data: {
							settings: coreUserInputSettings,
						},
					},
				} );

				const settings = registry.select( STORE_NAME ).getUserInputSettings();
				expect( settings ).toMatchObject( coreUserInputSettingsExpectedResponse );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const args = [ coreUserInputSettings ];
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post(
					coreUserInputSettingsEndpointRegExp,
					{ body: response, status: 500 }
				);

				await registry.dispatch( STORE_NAME ).saveUserInputSettings( ...args );
				expect( registry.select( STORE_NAME ).getErrorForAction( 'saveUserInputSettings', args ) ).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getUserInputSettings', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.getOnce(
					coreUserInputSettingsEndpointRegExp,
					{ body: coreUserInputSettingsExpectedResponse, status: 200 },
				);

				const { getUserInputSettings } = registry.select( STORE_NAME );

				expect( getUserInputSettings() ).toBeUndefined();
				await waitFor( () => getUserInputSettings() !== undefined );

				const settings = getUserInputSettings();
				expect( settings ).toEqual( coreUserInputSettingsExpectedResponse );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( getUserInputSettings() ).toEqual( settings );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveGetUserInputSettings( coreUserInputSettingsExpectedResponse );

				const settings = registry.select( STORE_NAME ).getUserInputSettings();
				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'getUserInputSettings' ) );

				expect( settings ).toEqual( coreUserInputSettingsExpectedResponse );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					coreUserInputSettingsEndpointRegExp,
					{ body: response, status: 500 },
				);

				registry.select( STORE_NAME ).getUserInputSettings();
				await subscribeUntil( registry, () => registry.select( STORE_NAME ).hasFinishedResolution( 'getUserInputSettings' ) );

				const settings = registry.select( STORE_NAME ).getUserInputSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getUserInputSetting', () => {
			beforeEach( () => {
				registry.dispatch( STORE_NAME ).receiveGetUserInputSettings( coreUserInputSettingsExpectedResponse );
			} );

			it.each(
				Object.keys( coreUserInputSettings ).reduce( ( accum, key ) => [ ...accum, [ key ] ], [] ),
			)( 'should return correct values for the %s setting', ( settingID ) => {
				const values = registry.select( STORE_NAME ).getUserInputSetting( settingID );
				expect( values ).toBe( coreUserInputSettings[ settingID ] );
			} );

			it( 'should return an empty array if the settings does not exist', () => {
				const helpWanted = registry.select( STORE_NAME ).getUserInputSetting( 'helpWanted' );
				expect( Array.isArray( helpWanted ) ).toBe( true );
				expect( helpWanted.length ).toBe( 0 );
			} );
		} );

		describe( 'getUserInputScope', () => {
			beforeEach( () => {
				registry.dispatch( STORE_NAME ).receiveGetUserInputSettings( coreUserInputSettingsExpectedResponse );
			} );

			it.each(
				Object.keys( coreUserInputSettings ).reduce( ( accum, key ) => [ ...accum, [ key ] ], [] ),
			)( 'should return correct scope for the %s setting', ( settingID ) => {
				const values = registry.select( STORE_NAME ).getUserInputSettingScope( settingID );
				expect( values ).toBe( coreUserInputSettingsExpectedResponse[ settingID ].scope );
			} );
		} );
	} );
} );
