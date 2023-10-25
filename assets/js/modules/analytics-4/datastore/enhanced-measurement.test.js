/**
 * `modules/analytics-4` data store: enhanced-measurement tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	createTestRegistry,
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import { enabledFeatures } from '../../../features';

describe( 'modules/analytics-4 enhanced-measurement', () => {
	let registry;

	const enhancedMeasurementSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
	);

	const propertyID = '12345';
	const webDataStreamID = '67890';
	let enhancedMeasurementSettingsMock;

	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;

		enhancedMeasurementSettingsMock = {
			fileDownloadsEnabled: null,
			name: 'properties/12345/dataStreams/67890/enhancedMeasurementSettings',
			outboundClicksEnabled: null,
			pageChangesEnabled: null,
			scrollsEnabled: null,
			searchQueryParameter: 'q,s,search,query,keyword',
			siteSearchEnabled: null,
			streamEnabled: true,
			uriQueryParameter: null,
			videoEngagementEnabled: null,
		};
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'setEnhancedMeasurementSettings', () => {
			it( 'should require a valid propertyID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementSettings(
							null,
							webDataStreamID,
							enhancedMeasurementSettingsMock
						)
				).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'should require a valid webDataStreamID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementSettings(
							propertyID,
							null,
							enhancedMeasurementSettingsMock
						)
				).toThrow( 'A valid GA4 webDataStreamID is required.' );
			} );

			it( 'should require a valid enhanced measurement settings object', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID,
							null
						);
				} ).toThrow(
					'Enhanced measurement settings must be an object.'
				);

				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID,
							{ invalidKey: 'value' }
						);
				} ).toThrow(
					'Enhanced measurement settings must contain only valid keys. Invalid key: "invalidKey"'
				);
			} );

			it( 'receives and sets enhanced measurement settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						{ ...enhancedMeasurementSettingsMock }
					);
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID
						)
				).toEqual( enhancedMeasurementSettingsMock );
			} );
		} );

		describe( 'setEnhancedMeasurementStreamEnabled', () => {
			it( 'should require a valid propertyID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementStreamEnabled(
							null,
							webDataStreamID,
							true
						)
				).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'should require a valid webDataStreamID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementStreamEnabled(
							propertyID,
							null,
							true
						)
				).toThrow( 'A valid GA4 webDataStreamID is required.' );
			} );

			it( 'should require enabled to be defined', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementStreamEnabled(
							propertyID,
							webDataStreamID,
							undefined
						)
				).toThrow( 'enabled is required.' );
			} );

			it( 'should require enabled to be a boolean', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementStreamEnabled(
							propertyID,
							webDataStreamID,
							'string_value'
						)
				).toThrow( 'enabled must be a boolean.' );
			} );

			it( 'sets stream enabled state and returns new settings', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						enhancedMeasurementSettingsMock
					);

				// Initially the `streamEnabled` setting is `true`.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID
						)
				).toEqual( enhancedMeasurementSettingsMock );

				// Set the `streamEnabled` setting to `false`.
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID,
						false
					);

				// Modify the initial settings mock to match the expected new settings.
				const expectedSettings = {
					...enhancedMeasurementSettingsMock,
					streamEnabled: null,
				};

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID
						)
				).toEqual( expectedSettings );
			} );
		} );

		describe( 'updateEnhancedMeasurementSettings', () => {
			it( 'should require a valid propertyID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.updateEnhancedMeasurementSettings(
							null,
							webDataStreamID
						)
				).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'should require a valid webDataStreamID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.updateEnhancedMeasurementSettings( propertyID, null )
				).toThrow( 'A valid GA4 webDataStreamID is required.' );
			} );

			it( 'should fetch and update settings if current settings exist', async () => {
				fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
					status: 200,
					body: enhancedMeasurementSettingsMock,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				const { response } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.updateEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					);

				expect( response ).toEqual( enhancedMeasurementSettingsMock );

				expect( fetchMock ).toHaveFetched(
					enhancedMeasurementSettingsEndpoint
				);
			} );
		} );

		describe( 'resetEnhancedMeasurementSettings', () => {
			it( 'should reset the enhanced measurement settings to the saved settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				const newSettings = {
					...enhancedMeasurementSettingsMock,
					streamEnabled: false,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						newSettings
					);

				// Verify that the settings have been updated.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID
						)
				).toEqual( newSettings );

				// Perform the reset action.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.resetEnhancedMeasurementSettings();

				// Verify that settings have been reset to the initial mock settings.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID
						)
				).toEqual( enhancedMeasurementSettingsMock );
			} );

			it( 'should delete settings if no saved settings exist', () => {
				muteFetch( enhancedMeasurementSettingsEndpoint );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.resetEnhancedMeasurementSettings();

				// Validate that the settings are now deleted.
				expect( store.getState().enhancedMeasurement ).toEqual( {} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getEnhancedMeasurementSettings', () => {
			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.get( enhancedMeasurementSettingsEndpoint, {
					body: enhancedMeasurementSettingsMock,
					status: 200,
				} );

				const initialSettings = registry
					.select( MODULES_ANALYTICS_4 )
					.getEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					);

				expect( initialSettings ).toBeUndefined();

				const finalSettings = await registry
					.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
					.getEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					);

				expect( finalSettings ).toEqual(
					enhancedMeasurementSettingsMock
				);
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				const settings = registry
					.select( MODULES_ANALYTICS_4 )
					.getEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					);
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getEnhancedMeasurementSettings( propertyID, webDataStreamID );

				expect( fetchMock ).not.toHaveFetched(
					enhancedMeasurementSettingsEndpoint
				);
				expect( settings ).toEqual( enhancedMeasurementSettingsMock );
			} );
		} );

		describe( 'isEnhancedMeasurementStreamEnabled', () => {
			it( 'should return the correct `streamEnabled` state', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				let streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						},
						{ propertyID, webDataStreamID }
					);

				streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( false );
			} );

			it( 'should return `undefined` if the settings are not loaded', async () => {
				fetchMock.get( enhancedMeasurementSettingsEndpoint, {
					body: enhancedMeasurementSettingsMock,
					status: 200,
				} );

				const streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getEnhancedMeasurementSettings( propertyID, webDataStreamID );
			} );

			it( 'should return `false` if the settings are loaded but the `streamEnabled` property is not present', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{},
						{ propertyID, webDataStreamID }
					);

				const streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( false );
			} );
		} );

		describe( 'isEnhancedMeasurementStreamAlreadyEnabled', () => {
			it( 'should return the correct `streamEnabled` state from the saved settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				let streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamAlreadyEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						},
						{ propertyID, webDataStreamID }
					);

				streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamAlreadyEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( false );
			} );

			it( 'should return `undefined` if the settings are not loaded', async () => {
				fetchMock.get( enhancedMeasurementSettingsEndpoint, {
					body: enhancedMeasurementSettingsMock,
					status: 200,
				} );

				const streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamAlreadyEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getEnhancedMeasurementSettings( propertyID, webDataStreamID );
			} );

			it( 'should return `false` if the settings are loaded but the `streamEnabled` property is not present', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{},
						{ propertyID, webDataStreamID }
					);

				const streamEnabled = registry
					.select( MODULES_ANALYTICS_4 )
					.isEnhancedMeasurementStreamAlreadyEnabled(
						propertyID,
						webDataStreamID
					);

				expect( streamEnabled ).toBe( false );
			} );
		} );

		describe( 'haveEnhancedMeasurementSettingsChanged', () => {
			it( 'should compare settings and savedSettings and return the correct value', () => {
				const savedSettings = {
					...enhancedMeasurementSettingsMock,
					streamEnabled: false,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);

				const hasChanged = registry
					.select( MODULES_ANALYTICS_4 )
					.haveEnhancedMeasurementSettingsChanged(
						propertyID,
						webDataStreamID
					);

				expect( hasChanged ).toBe( false );

				// Change the settings.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						savedSettings
					);

				const hasChangedAfterSet = registry
					.select( MODULES_ANALYTICS_4 )
					.haveEnhancedMeasurementSettingsChanged(
						propertyID,
						webDataStreamID
					);

				expect( hasChangedAfterSet ).toBe( true );
			} );
		} );

		describe( 'haveAnyGA4SettingsChanged', () => {
			beforeEach( () => {
				enabledFeatures.add( 'enhancedMeasurement' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( { propertyID, webDataStreamID } );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						enhancedMeasurementSettingsMock,
						{ propertyID, webDataStreamID }
					);
			} );

			it( 'should return `false` if neither the GA4 module settings or the enhanced measurement settings have changed', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.haveAnyGA4SettingsChanged()
				).toBe( false );
			} );

			it( 'should return `true` if the GA4 module settings have changed', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( { propertyID: '54321' } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.haveAnyGA4SettingsChanged()
				).toBe( true );
			} );

			it( 'should return `true` if the enhanced measurement settings have changed', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						}
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.haveAnyGA4SettingsChanged()
				).toBe( true );
			} );
		} );
	} );
} );
