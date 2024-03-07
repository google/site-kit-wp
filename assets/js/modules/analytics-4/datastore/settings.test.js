/**
 * `modules/analytics-4` data store: settings tests.
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
import {
	createTestRegistry,
	muteFetch,
	provideUserAuthentication,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { withActive } from '../../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from './constants';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import {
	INVARIANT_INVALID_PROPERTY_SELECTION,
	INVARIANT_INVALID_WEBDATASTREAM_ID,
} from './settings';
import * as fixtures from './__fixtures__';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../constants';

describe( 'modules/analytics-4 settings', () => {
	let registry;

	const error = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);
	const createPropertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-property'
	);
	const createWebDataStreamsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-webdatastream'
	);
	const propertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/property'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive() );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			beforeEach( () => {
				provideUserAuthentication( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					accountID: fixtures.createProperty._accountID,
				} );
			} );

			it( 'should dispatch createProperty and createWebDataStream actions if the "set up a new property" option is chosen', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce( createPropertyEndpoint, {
					body: fixtures.createProperty,
					status: 200,
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				fetchMock.postOnce( settingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
					),
					{
						body: [],
						status: 200,
					}
				);

				const result = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.submitChanges();

				expect( result.error ).toBeFalsy();

				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: {
						data: { accountID: fixtures.createProperty._accountID },
					},
				} );
				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				const propertyID = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyID();
				expect( propertyID ).toBe( fixtures.createProperty._id );

				const webDataStreamID = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamID();
				expect( webDataStreamID ).toBe(
					fixtures.createWebDataStream._id
				);
			} );

			it( 'should handle an error if set while creating a property', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce( createPropertyEndpoint, {
					body: error,
					status: 500,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: {
						data: { accountID: fixtures.createProperty._accountID },
					},
				} );
				expect( fetchMock ).not.toHaveFetched(
					createWebDataStreamsEndpoint
				);

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
				).toBe( PROPERTY_CREATE );
				// @TODO: uncomment the following line once GA4 API is stabilized
				// expect( registry.select( MODULES_ANALYTICS_4 ).getErrorForAction( 'submitChanges' ) ).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'should dispatch createWebDataStream actions if webDataStreamID is invalid', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: '',
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				fetchMock.postOnce( settingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.submitChanges();
				expect( result.error ).toBeFalsy();

				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				const webDataStreamID = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamID();
				expect( webDataStreamID ).toBe(
					fixtures.createWebDataStream._id
				);
			} );

			it( 'should handle an error if set while creating a web data stream', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: '',
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: error,
					status: 500,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
				).toBe( '' );
				// @TODO: uncomment the following line once GA4 API is stabilized
				// expect( registry.select( MODULES_ANALYTICS_4 ).getErrorForAction( 'submitChanges' ) ).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			describe( 'when enhanced measurement is enabled', () => {
				const propertyID = '1000';
				const webDataStreamID = '2000';

				const enhancedMeasurementSettingsEndpoint = new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
				);

				const enabledSettingsMock = {
					fileDownloadsEnabled: null,
					name: 'properties/1000/dataStreams/2000/enhancedMeasurementSettings',
					outboundClicksEnabled: null,
					pageChangesEnabled: null,
					scrollsEnabled: null,
					searchQueryParameter: 'q,s,search,query,keyword',
					siteSearchEnabled: null,
					streamEnabled: true,
					uriQueryParameter: null,
					videoEngagementEnabled: null,
				};

				const disabledSettingsMock = {
					...enabledSettingsMock,
					streamEnabled: false,
				};

				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetSettings( { propertyID, webDataStreamID } );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetEnhancedMeasurementSettings(
							disabledSettingsMock,
							{ propertyID, webDataStreamID }
						);

					registry
						.dispatch( CORE_FORMS )
						.setValues( ENHANCED_MEASUREMENT_FORM, {
							[ ENHANCED_MEASUREMENT_ENABLED ]: true,
						} );

					fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
						status: 200,
						body: enabledSettingsMock,
					} );
					fetchMock.postOnce( settingsEndpoint, {
						status: 200,
						body: {},
					} );
				} );

				it( 'should save the enhanced measurement settings and dismiss the activation banner if the setting has been changed', async () => {
					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();

					expect( fetchMock ).toHaveFetched(
						enhancedMeasurementSettingsEndpoint,
						{
							body: {
								data: {
									propertyID,
									webDataStreamID,
									enhancedMeasurementSettings:
										enabledSettingsMock,
								},
							},
						}
					);
					expect( fetchMock ).toHaveFetchedTimes( 1 );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveEnhancedMeasurementSettingsChanged(
								propertyID,
								webDataStreamID
							)
					).toBe( false );
				} );

				it( 'should dismiss the activation banner when the required form setting is set', async () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( ENHANCED_MEASUREMENT_FORM, {
							[ ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER ]: true,
						} );

					const dismissItemEndpoint = new RegExp(
						'^/google-site-kit/v1/core/user/data/dismiss-item'
					);

					fetchMock.postOnce( dismissItemEndpoint, {
						body: JSON.stringify( [
							ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
						] ),
						status: 200,
					} );

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();

					expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
						body: {
							data: {
								slug: ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
								expiration: 0,
							},
						},
					} );
					expect( fetchMock ).toHaveFetchedTimes( 2 );
				} );

				it( 'should not save the enhanced measurement settings if the form value is not defined', async () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( ENHANCED_MEASUREMENT_FORM, {
							[ ENHANCED_MEASUREMENT_ENABLED ]: undefined,
						} );

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();
				} );

				it( 'should not save the enhanced measurement settings if the form value is `false`', async () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( ENHANCED_MEASUREMENT_FORM, {
							[ ENHANCED_MEASUREMENT_ENABLED ]: false,
						} );

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();
				} );

				it( 'should not save the enhanced measurement settings if the setting has not been changed', async () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetEnhancedMeasurementSettings(
							enabledSettingsMock,
							{ propertyID, webDataStreamID }
						);

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();
				} );

				it( 'should handle and return an error when saving enhanced measurement settings', async () => {
					const errorObject = {
						code: 'internal_error',
						message: 'Something wrong happened.',
						data: { status: 500 },
					};

					fetchMock.reset();
					fetchMock.postOnce( enhancedMeasurementSettingsEndpoint, {
						status: 500,
						body: errorObject,
					} );

					muteFetch( propertyEndpoint );

					const { error: responseError } = await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.submitChanges();

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						enhancedMeasurementSettingsEndpoint
					);
					expect( responseError ).toEqual( errorObject );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveEnhancedMeasurementSettingsChanged(
								propertyID,
								webDataStreamID
							)
					).toBe( true );
					expect( console ).toHaveErrored();
				} );
			} );

			it( 'should dispatch saveSettings', async () => {
				const validSettings = {
					accountID: fixtures.createProperty._accountID,
					propertyID: fixtures.createProperty._id,
					webDataStreamID: fixtures.createWebDataStream._id,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( validSettings );

				fetchMock.postOnce( settingsEndpoint, {
					body: validSettings,
					status: 200,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched( settingsEndpoint, {
					body: { data: validSettings },
				} );
				expect(
					registry.select( MODULES_ANALYTICS_4 ).haveSettingsChanged()
				).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'canSubmitChanges', () => {
			const propertyID = '1000';
			const webDataStreamID = '2000';

			describe( 'required changes', () => {
				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetSettings( {
							propertyID,
							webDataStreamID,
						} );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetEnhancedMeasurementSettings(
							{ streamEnabled: true },
							{ propertyID, webDataStreamID }
						);
				} );

				it( 'requires a change to analytics-4 settings or enhanced measurement settings to have been made', () => {
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.canSubmitChanges()
					).toBe( false );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS_4 )
							.__dangerousCanSubmitChanges()
					).toThrow( INVARIANT_SETTINGS_NOT_CHANGED );
				} );

				it( 'accepts a change to analytics-4 settings as a valid change', () => {
					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '1001',
					} );

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.canSubmitChanges()
					).toBe( true );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS_4 )
							.__dangerousCanSubmitChanges()
					).not.toThrow();
				} );

				it( 'accepts a change to enhanced measurement settings as a valid change', () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setEnhancedMeasurementSettings(
							propertyID,
							webDataStreamID,
							{
								streamEnabled: false,
							}
						);

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.canSubmitChanges()
					).toBe( true );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS_4 )
							.__dangerousCanSubmitChanges()
					).not.toThrow();
				} );
			} );

			it( 'should require a valid propertyID', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( null );
				expect( () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROPERTY_SELECTION );
			} );

			it( 'should require a valid webDataStreamID', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( '' );
				expect( () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_WEBDATASTREAM_ID );
			} );
		} );
	} );
} );
