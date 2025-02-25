/**
 * Settings datastore functions tests.
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	muteFetch,
	subscribeUntil,
	untilResolved,
} from '../../../../tests/js/utils';
import { createSettingsStore } from './create-settings-store';
import { CORE_SITE } from '../datastore/site/constants';

const STORE_ARGS = [ 'core', 'site', 'settings' ];

describe( 'createSettingsStore store', () => {
	let dispatch;
	let registry;
	let select;
	let storeDefinition;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createSettingsStore( ...STORE_ARGS, {
			settingSlugs: [ 'isSkyBlue', 'isGroundGreen' ],
			registry,
		} );
		registry.registerStore( storeDefinition.STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( storeDefinition.STORE_NAME );
		store = registry.stores[ storeDefinition.STORE_NAME ].store;
		select = registry.select( storeDefinition.STORE_NAME );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'name', () => {
		it( 'returns the correct default store name', () => {
			expect( storeDefinition.STORE_NAME ).toEqual(
				`${ STORE_ARGS[ 0 ] }/${ STORE_ARGS[ 1 ] }`
			);
		} );
	} );

	describe( 'actions', () => {
		describe( 'setSettings', () => {
			it( 'requires the values param', () => {
				expect( () => {
					dispatch.setSettings();
				} ).toThrow( 'values is required.' );
			} );

			it( 'updates the respective settings', () => {
				const values1 = { setting1: 'old', setting2: 'old' };
				const values2 = { setting2: 'new' };

				dispatch.setSettings( values1 );
				expect( store.getState().settings ).toMatchObject( values1 );

				dispatch.setSettings( values2 );
				expect( store.getState().settings ).toMatchObject( {
					...values1,
					...values2,
				} );
			} );
		} );

		describe( 'fetchGetSettings', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/core/site/data/settings'
						)
					);
					dispatch.fetchGetSettings();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetSettings', () => {
			it( 'requires the response param', () => {
				expect( () => {
					dispatch.receiveGetSettings();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets values', () => {
				const serverValues = {
					setting1: 'serverside',
					setting2: 'serverside',
				};
				const clientValues = { setting1: 'clientside' };

				dispatch.setSettings( clientValues );
				dispatch.receiveGetSettings( serverValues, {} );

				// Client values take precedence if they were already modified before receiving from the server.
				expect( store.getState().settings ).toMatchObject( {
					...serverValues,
					...clientValues,
				} );
			} );
		} );

		describe( 'saveSettings', () => {
			it( 'does not require any params', () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: {}, status: 200 }
				);
				const values = { setting1: 'serverside' };
				dispatch.setSettings( values, {} );
				expect( async () => {
					fetchMock.postOnce(
						new RegExp(
							'^/google-site-kit/v1/core/site/data/settings'
						),
						{ body: values, status: 200 }
					);
					await dispatch.saveSettings();
				} ).not.toThrow();
			} );

			it( 'updates settings from server', async () => {
				const response = { isSkyBlue: 'yes' };
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: response, status: 200 }
				);

				// Set initial settings so that they are considered loaded.
				dispatch.receiveGetSettings( response, {} );

				// The server is the authority. So because this won't be part of the response
				// (see above), it will be disregarded.
				dispatch.setSettings( { isSkyBlue: 'no' } );

				dispatch.saveSettings();

				await subscribeUntil(
					registry,
					() => select.isDoingSaveSettings() === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{
						body: { data: { isSkyBlue: 'no' } },
					}
				);

				expect( store.getState().settings ).toMatchObject( response );
			} );
		} );

		describe( 'fetchSaveSettings', () => {
			it( 'requires the values param', () => {
				expect( () => {
					dispatch.fetchSaveSettings();
				} ).toThrow( 'values is required.' );
			} );

			it( 'sets isDoingSaveSettings', () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: { setting1: true }, status: 200 }
				);

				dispatch.fetchSaveSettings( {} );
				expect( select.isDoingSaveSettings() ).toEqual( true );
			} );
		} );

		describe( 'receiveSaveSettings', () => {
			it( 'requires the response param', () => {
				expect( () => {
					dispatch.receiveSaveSettings();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets values', () => {
				const serverValues = {
					setting1: 'serverside',
					setting2: 'serverside',
				};
				const clientValues = {
					setting1: 'clientside',
					setting3: 'clientside',
				};

				dispatch.setSettings( clientValues );
				dispatch.receiveSaveSettings( serverValues, { values: {} } );

				// Client values are ignored here, server values replace them.
				expect( store.getState().settings ).toMatchObject( {
					...serverValues,
				} );
			} );
		} );

		// Tests for "pseudo-action" setSetting, available via setting-specific "set{SettingSlug}".
		describe( 'setSetting', () => {
			it( 'has the correct action name', () => {
				expect( Object.keys( storeDefinition.actions ) ).toEqual(
					// "isSkyBlue" should turn into "setIsSkyBlue".
					expect.arrayContaining( [ 'setIsSkyBlue' ] )
				);
			} );

			it( 'returns the correct action type', () => {
				const action = storeDefinition.actions.setIsSkyBlue( true );
				// "isSkyBlue" should turn into "SET_IS_SKY_BLUE".
				expect( action.type ).toEqual( 'SET_IS_SKY_BLUE' );
			} );

			it( 'requires the value param', () => {
				expect( () => {
					dispatch.setIsSkyBlue();
				} ).toThrow( 'value is required for calls to setIsSkyBlue().' );
			} );

			it( 'supports setting falsy values', () => {
				expect( () => {
					dispatch.setIsSkyBlue( false );
				} ).not.toThrow(
					'value is required for calls to setIsSkyBlue().'
				);
			} );

			it( 'updates the respective setting', () => {
				const value = 'new';

				dispatch.setIsSkyBlue( value );
				expect( store.getState().settings ).toMatchObject( {
					isSkyBlue: value,
				} );
			} );
		} );

		describe( 'rollbackSettings', () => {
			it( 'returns settings back to their saved values', () => {
				const savedSettings = { isSkyBlue: 'yes' };
				dispatch.receiveSaveSettings( savedSettings, { values: {} } );

				expect( select.getIsSkyBlue() ).toBe( 'yes' );

				dispatch.setIsSkyBlue( 'maybe' );
				expect( select.getIsSkyBlue() ).toBe( 'maybe' );

				dispatch.rollbackSettings();

				expect( select.getIsSkyBlue() ).toBe( 'yes' );
			} );
		} );

		describe( 'rollbackSetting', () => {
			it( 'requires the setting param', () => {
				expect( () => {
					dispatch.rollbackSetting();
				} ).toThrow( 'setting is required.' );
			} );

			it( 'returns a specific setting back to its saved value', () => {
				const savedSettings = {
					isSkyBlue: 'yes',
					isGroundGreen: 'yes',
				};

				dispatch.receiveSaveSettings( savedSettings, { values: {} } );

				expect( select.getIsSkyBlue() ).toBe( 'yes' );
				expect( select.getIsGroundGreen() ).toBe( 'yes' );

				dispatch.setIsSkyBlue( 'no' );
				dispatch.setIsGroundGreen( 'maybe' );

				expect( select.getIsSkyBlue() ).toBe( 'no' );
				expect( select.getIsGroundGreen() ).toBe( 'maybe' );

				dispatch.rollbackSetting( 'isGroundGreen' );

				expect( select.getIsSkyBlue() ).toBe( 'no' );
				expect( select.getIsGroundGreen() ).toBe( 'yes' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const response = { setting1: 'value' };
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: response, status: 200 }
				);

				const initialSettings = select.getSettings();
				// Settings will be their initial value while being fetched.
				expect( initialSettings ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				const settings = select.getSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toEqual( response );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( select.getSettings() ).toEqual( settings );
			} );

			it( 'does not make a network request if settings are already set', async () => {
				const value = 'serverside';

				dispatch.receiveGetSettings( { isSkyBlue: value }, {} );

				expect( select.getIsSkyBlue() ).toEqual( value );

				await subscribeUntil( registry, () =>
					select.hasFinishedResolution( 'getSettings' )
				);

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns client settings even if server settings have not loaded', () => {
				const values = { setting1: 'value' };
				dispatch.setSettings( values );

				// If settings are set on the client, they must be available even
				// if settings have not been loaded from the server yet.
				muteFetch(
					new RegExp( '^/google-site-kit/v1/core/site/data/settings' )
				);
				expect( select.getSettings() ).toEqual( values );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: response, status: 500 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetSettings() === false
				);

				const settings = select.getSettings();

				await untilResolved(
					registry,
					storeDefinition.STORE_NAME
				).getSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( settings ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		test.each( [
			[ 'haveSettingsChanged' ],
			[ '__dangerousHaveSettingsChanged' ],
		] )( 'should have %s selector', ( selector ) => {
			const selectors = storeDefinition.selectors;
			expect( typeof selectors[ selector ] ).toBe( 'function' );
		} );

		describe.each( [
			[ 'haveSettingsChanged' ],
			[ '__dangerousHaveSettingsChanged' ],
		] )( '%s', ( selector ) => {
			it( 'should use provided validateHaveSettingsChanged function', () => {
				const validateHaveSettingsChanged = jest.fn();

				storeDefinition = createSettingsStore( ...STORE_ARGS, {
					settingSlugs: [ 'isSkyBlue' ],
					validateHaveSettingsChanged,
					registry,
				} );

				registry.registerStore(
					storeDefinition.STORE_NAME,
					storeDefinition
				);

				storeDefinition.selectors[ selector ]();

				expect( validateHaveSettingsChanged ).toHaveBeenCalled();
			} );
		} );

		describe( '__dangerousHaveSettingsChanged', () => {
			it( 'should throw an exception from validateHaveSettingsChanged when error occurs', () => {
				const validateHaveSettingsChanged = null;

				createSettingsStore( ...STORE_ARGS, {
					settingSlugs: [ 'isSkyBlue' ],
					validateHaveSettingsChanged,
					registry,
				} );

				expect( () =>
					registry
						.select( CORE_SITE )
						.__dangerousHaveSettingsChanged()
				).toThrow();
			} );
		} );

		describe( 'haveSettingsChanged', () => {
			it( 'informs whether client-side settings differ from server-side ones', async () => {
				// Initially false.
				expect( select.haveSettingsChanged() ).toEqual( false );

				const serverValues = { setting1: 'serverside' };
				const clientValues = { setting1: 'clientside' };

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect( select.haveSettingsChanged() ).toEqual( false );

				// True after updating settings on client.
				dispatch.setSettings( clientValues );
				expect( select.haveSettingsChanged() ).toEqual( true );

				// False after updating settings back to original server value on client.
				dispatch.setSettings( serverValues );
				expect( select.haveSettingsChanged() ).toEqual( false );
			} );

			it( 'compares all keys when keys argument is not supplied', async () => {
				const serverValues = {
					setting1: 'serverside',
					setting2: 'test-value',
				};
				const clientValues = {
					setting1: 'clientside',
					setting2: 'test-value',
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Update the settings so they differ. All values are being checked
				// here.
				dispatch.setSettings( clientValues );
				expect( select.haveSettingsChanged() ).toEqual( true );
			} );

			it( 'compares select keys when keys argument is supplied', async () => {
				const serverValues = {
					setting1: 'serverside',
					setting2: 'test-value',
				};
				const clientValues = {
					setting1: 'clientside',
					setting2: 'test-value',
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Update the settings so they differ. Only `setting1` should trigger
				// a truthy return value.
				dispatch.setSettings( clientValues );
				expect( select.haveSettingsChanged( [ 'setting1' ] ) ).toEqual(
					true
				);
				expect( select.haveSettingsChanged( [ 'setting2' ] ) ).toEqual(
					false
				);

				// Checking all values should be possible.
				expect(
					select.haveSettingsChanged( [ 'setting1', 'setting2' ] )
				).toEqual( true );

				// Checking no values should be possible, and should not be treated as
				// an `undefined` keys array.
				expect( select.haveSettingsChanged( [] ) ).toEqual( false );
			} );

			it( 'should not throw an exception', () => {
				const validateHaveSettingsChanged = null;

				createSettingsStore( ...STORE_ARGS, {
					settingSlugs: [ 'isSkyBlue' ],
					validateHaveSettingsChanged,
					registry,
				} );

				// Since selector is invalid, it should return false as exception would be caught by the safeSelector.
				expect(
					registry.select( CORE_SITE ).haveSettingsChanged()
				).toBe( false );
			} );
		} );

		describe( 'haveOwnedSettingsChanged', () => {
			it( 'only compares owned settings when checking for changes', async () => {
				storeDefinition = createSettingsStore( ...STORE_ARGS, {
					ownedSettingsSlugs: [ 'ourSetting', 'ourSetting2' ],
					settingSlugs: [
						'yourSetting',
						'ourSetting',
						'ourSetting2',
					],
					registry,
				} );
				registry.registerStore(
					storeDefinition.STORE_NAME,
					storeDefinition
				);
				dispatch = registry.dispatch( storeDefinition.STORE_NAME );
				select = registry.select( storeDefinition.STORE_NAME );

				// Initially false.
				expect( select.haveOwnedSettingsChanged() ).toEqual( false );

				const serverValues = {
					yourSetting: 'foo',
					ourSetting: 'good',
					ourSetting2: 1,
				};
				const clientValues = {
					yourSetting: 'bar',
					ourSetting: 'bad',
					ourSetting2: 1,
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect( select.haveOwnedSettingsChanged() ).toEqual( false );

				// True after updating settings on client.
				dispatch.setSettings( clientValues );
				expect( select.haveOwnedSettingsChanged() ).toEqual( true );

				// False after updating settings back to original server value on
				// the client, then changing a non-owned setting.
				dispatch.setSettings( {
					...serverValues,
					yourSetting: 'whatever',
				} );
				expect( select.haveOwnedSettingsChanged() ).toEqual( false );
			} );
		} );

		describe( 'hasSettingChanged', () => {
			it( 'informs whether client-side specific setting differ from server-side ones', async () => {
				const serverValues = { setting1: 'serverside' };
				const clientValues = { setting1: 'clientside' };

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect( select.hasSettingChanged( 'setting1' ) ).toEqual(
					false
				);

				// True after updating settings on client.
				dispatch.setSettings( clientValues );
				expect( select.hasSettingChanged( 'setting1' ) ).toEqual(
					true
				);

				// False after updating settings back to original server value on client.
				dispatch.setSettings( serverValues );
				expect( select.hasSettingChanged( 'setting1' ) ).toEqual(
					false
				);
			} );
		} );

		// Tests for "pseudo-selector" getSetting, available via setting-specific "get{SettingSlug}".
		describe( 'getSetting', () => {
			it( 'has the correct selector name', () => {
				expect( Object.keys( storeDefinition.selectors ) ).toEqual(
					// "isSkyBlue" should turn into "getIsSkyBlue".
					expect.arrayContaining( [ 'getIsSkyBlue' ] )
				);
			} );

			it( 'uses a resolver to make a network request', async () => {
				const value = 'serverside';
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/settings'
					),
					{
						body: {
							otherSetting: 'other-value',
							isSkyBlue: value,
						},
						status: 200,
					}
				);

				// Setting will have its initial value while being fetched.
				expect( select.getIsSkyBlue() ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( select.getIsSkyBlue() ).toEqual( value );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );

	describe( 'per-setting selectors', () => {
		it( 'get{SettingSlug}', () => {
			dispatch.setSettings( { isSkyBlue: 'yes' } );

			expect( select.getIsSkyBlue() ).toBe( 'yes' );
		} );

		it( 'set{SettingSlug}', () => {
			dispatch.setSettings( { isSkyBlue: 'yes' } );

			dispatch.setIsSkyBlue( 'not right now' );

			expect( select.getIsSkyBlue() ).toBe( 'not right now' );
		} );
	} );

	describe( 'controls', () => {
		describe( 'FETCH_GET_SETTINGS', () => {
			it( 'requests from the correct API endpoint', async () => {
				const [ type, identifier, datapoint ] = STORE_ARGS;
				const response = { type, identifier, datapoint };

				fetchMock
					.getOnce(
						`path:/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
						{ body: response, status: 200 }
					)
					.catch( {
						body: {
							code: 'incorrect_api_endpoint',
							message: 'Incorrect API endpoint',
							data: { status: 400 },
						},
						init: { status: 400 },
					} );

				const result =
					await storeDefinition.controls.FETCH_GET_SETTINGS( {
						type: 'FETCH_GET_SETTINGS',
						payload: { params: {} },
					} );
				expect( result ).toEqual( response );
				// Ensure `console.error()` wasn't called, which will happen if the API
				// request fails.
				expect( global.console.error ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'FETCH_SAVE_SETTINGS', () => {
			it( 'requests from the correct API endpoint', async () => {
				const [ type, identifier, datapoint ] = STORE_ARGS;
				const response = { type, identifier, datapoint };

				fetchMock
					.postOnce(
						`path:/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
						{ body: response, status: 200 }
					)
					.catch( {
						body: {
							code: 'incorrect_api_endpoint',
							message: 'Incorrect API endpoint',
							data: { status: 400 },
						},
						init: { status: 400 },
					} );

				const result =
					await storeDefinition.controls.FETCH_SAVE_SETTINGS( {
						type: 'FETCH_SAVE_SETTINGS',
						payload: { params: { values: {} } },
					} );
				expect( result ).toEqual( response );
				// Ensure `console.error()` wasn't called, which will happen if the API
				// request fails.
				expect( global.console.error ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
