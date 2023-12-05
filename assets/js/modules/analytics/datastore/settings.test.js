/**
 * `modules/analytics` data store: settings tests.
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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
} from '../../analytics-4/datastore/constants';
import {
	MODULES_ANALYTICS,
	FORM_SETUP,
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	PROFILE_CREATE,
} from './constants';
import {
	createTestRegistry,
	provideModules,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';
import { INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { INVARIANT_INVALID_WEBDATASTREAM_ID } from '../../analytics-4/datastore/settings';
import * as ga4fixtures from '../../analytics-4/datastore/__fixtures__';
import {
	INVARIANT_INVALID_ACCOUNT_ID,
	INVARIANT_INVALID_CONVERSION_ID,
	INVARIANT_INVALID_PROFILE_NAME,
	INVARIANT_INVALID_PROFILE_SELECTION,
	INVARIANT_INVALID_PROPERTY_SELECTION,
} from './settings';
import ga4ReportingTour from '../../../feature-tours/ga4-reporting';

describe( 'modules/analytics settings', () => {
	let registry;

	const gaSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics/data/settings'
	);
	const ga4SettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	const validSettings = {
		accountID: '12345',
		adsConversionID: '',
		propertyID: 'UA-12345-1',
		internalWebPropertyID: '23245',
		profileID: '54321',
		useSnippet: true,
		trackingDisabled: [],
		anonymizeIP: true,
		canUseSnippet: true,
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

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { ...ga4fixtures.defaultSettings } );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			// Receive empty settings to prevent unexpected fetch by resolver.
			registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		} );

		describe( 'submitChanges', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );
			} );

			it( 'dispatches createProperty if the "set up a new property" option is chosen', async () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
				} );
				const createdProperty = {
					...fixtures.propertiesProfiles.properties[ 0 ],
					id: 'UA-12345-1',
					// eslint-disable-next-line sitekit/acronym-case
					internalWebPropertyId: '123456789',
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: createdProperty, status: 200 }
				);
				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS )
					.submitChanges();
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: { data: { accountID: '12345' } } }
				);

				expect( result.error ).toBeFalsy();
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( createdProperty.id );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
					// eslint-disable-next-line sitekit/acronym-case
				).toBe( createdProperty.internalWebPropertyId );
			} );

			it( 'handles an error if set while creating a property', async () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: error, status: 500 }
				);

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: { data: { accountID: '12345' } } }
				);

				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( PROPERTY_CREATE );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getErrorForAction( 'submitChanges' )
				).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'dispatches createProfile if the "set up a new profile" option is chosen', async () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				const profileName = fixtures.createProfile.name;
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: 'UA-12345-1',
					profileID: PROFILE_CREATE,
				} );
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					profileName,
				} );
				const createdProfile = {
					...fixtures.propertiesProfiles.profiles[ 0 ],
					id: '987654321',
				};
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: createdProfile, status: 200 }
				);
				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{
						body: {
							data: {
								accountID: '12345',
								propertyID: 'UA-12345-1',
								profileName,
							},
						},
					}
				);

				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( createdProfile.id );
			} );

			it( 'handles an error if set while creating a profile', async () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				const profileName = fixtures.createProfile.name;

				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: 'UA-12345-1',
					profileID: PROFILE_CREATE,
				} );

				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					profileName,
				} );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: error, status: 500 }
				);

				const result = await registry
					.dispatch( MODULES_ANALYTICS )
					.submitChanges();

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{
						body: {
							data: {
								accountID: '12345',
								propertyID: 'UA-12345-1',
								profileName,
							},
						},
					}
				);
				expect( result.error ).toEqual( error );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( PROFILE_CREATE );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getErrorForAction( 'submitChanges' )
				).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'dispatches both createProperty and createProfile when selected', async () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				const profileName = fixtures.createProfile.name;
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					accountID: '12345',
					propertyID: PROPERTY_CREATE,
					profileID: PROFILE_CREATE,
				} );
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					profileName,
				} );
				const createdProperty = {
					...fixtures.propertiesProfiles.properties[ 0 ],
					id: 'UA-12345-1',
				};
				const createdProfile = {
					...fixtures.propertiesProfiles.profiles[ 0 ],
					id: '987654321',
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: createdProperty, status: 200 }
				);
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: createdProfile, status: 200 }
				);
				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( createdProperty.id );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( createdProfile.id );
			} );

			it( 'dispatches saveSettings', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );

				fetchMock.postOnce( gaSettingsEndpoint, {
					body: validSettings,
					status: 200,
				} );

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect( fetchMock ).toHaveFetched( gaSettingsEndpoint, {
					body: { data: validSettings },
				} );
				expect(
					registry.select( MODULES_ANALYTICS ).haveSettingsChanged()
				).toBe( false );
			} );

			it( 'returns an error if saveSettings fails', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );

				fetchMock.postOnce( gaSettingsEndpoint, {
					body: error,
					status: 500,
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS )
					.submitChanges();

				expect( fetchMock ).toHaveFetched( gaSettingsEndpoint, {
					body: { data: validSettings },
				} );
				expect( result.error ).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates Analytics API cache on success', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );

				fetchMock.postOnce( gaSettingsEndpoint, {
					body: validSettings,
					status: 200,
				} );

				const cacheKey = createCacheKey(
					'modules',
					'analytics',
					'arbitrary-datapoint'
				);
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );

			it( 'does not dispatch createProperty when the `enableUA` form value is false', async () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS )
					.submitChanges();

				// Ensure that the create-property request is not made.
				expect( fetchMock ).not.toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					)
				);

				expect( result.error ).toBeFalsy();
			} );

			it( 'does not dispatch createProfile when the `enableUA` form value is false', async () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					profileID: PROFILE_CREATE,
				} );

				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				// Ensure that the create-profile request is not made.
				expect( fetchMock ).not.toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					)
				);
			} );

			it( 'does not dispatch both createProperty and createProfile when selected and when the `enableUA` form value is false', async () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					propertyID: PROPERTY_CREATE,
					profileID: PROFILE_CREATE,
				} );

				fetchMock.postOnce( gaSettingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				await registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				// Ensure that the create-property request is not made.
				expect( fetchMock ).not.toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					)
				);

				// Ensure that the create-profile request is not made.
				expect( fetchMock ).not.toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					)
				);
			} );

			describe( 'dismiss ga4Reporting feature tour', () => {
				const fetchDismissTourRegExp = new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-tour'
				);

				it( 'should not dismiss the ga4Reporting feature tour if it is already dismissed', async () => {
					registry
						.dispatch( CORE_USER )
						.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );
					registry.dispatch( MODULES_ANALYTICS ).setSettings( {
						...validSettings,
					} );

					fetchMock.postOnce( gaSettingsEndpoint, {
						body: validSettings,
					} );

					expect(
						registry
							.select( CORE_USER )
							.isTourDismissed( ga4ReportingTour.slug )
					).toBe( true );

					await registry
						.dispatch( MODULES_ANALYTICS )
						.submitChanges();

					expect(
						registry
							.select( CORE_USER )
							.isTourDismissed( ga4ReportingTour.slug )
					).toBe( true );

					expect( fetchMock ).not.toHaveFetched(
						fetchDismissTourRegExp
					);
				} );

				it( 'should dismiss the ga4Reporting feature tour if it has not been dismissed yet', async () => {
					registry
						.dispatch( CORE_USER )
						.receiveGetDismissedTours( [] );
					registry.dispatch( MODULES_ANALYTICS ).setSettings( {
						...validSettings,
					} );

					fetchMock.postOnce( gaSettingsEndpoint, {
						body: validSettings,
					} );
					fetchMock.postOnce( fetchDismissTourRegExp, {
						body: [ ga4ReportingTour.slug ],
					} );

					expect(
						registry
							.select( CORE_USER )
							.isTourDismissed( ga4ReportingTour.slug )
					).toBe( false );

					await registry
						.dispatch( MODULES_ANALYTICS )
						.submitChanges();

					expect(
						registry
							.select( CORE_USER )
							.isTourDismissed( ga4ReportingTour.slug )
					).toBe( true );
				} );
			} );

			describe( 'analytics-4', () => {
				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS )
						.receiveGetExistingTag( null );
					registry
						.dispatch( MODULES_ANALYTICS )
						.setSettings( validSettings );

					provideModules( registry, [
						{
							slug: 'analytics',
							active: true,
							connected: true,
						},
						{
							slug: 'analytics-4',
							active: true,
							connected: true,
						},
					] );
				} );

				it( 'should save analytics-4 settings as well', async () => {
					const propertyID = '1000';
					const ga4Settings = {
						...ga4fixtures.defaultSettings,
						propertyID,
						webDataStreamID: '2000',
					};

					fetchMock.postOnce( gaSettingsEndpoint, {
						body: validSettings,
					} );
					fetchMock.postOnce( ga4SettingsEndpoint, {
						body: ga4Settings,
					} );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setSettings( ga4Settings );

					expect(
						registry
							.select( MODULES_ANALYTICS )
							.haveSettingsChanged()
					).toBe( true );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveSettingsChanged()
					).toBe( true );

					const { error: saveChangesError } = await registry
						.dispatch( MODULES_ANALYTICS )
						.submitChanges();
					expect( saveChangesError ).toBeUndefined();

					expect( fetchMock ).toHaveFetched( gaSettingsEndpoint, {
						body: { data: validSettings },
					} );
					expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
						body: { data: ga4Settings },
					} );

					expect(
						registry
							.select( MODULES_ANALYTICS )
							.haveSettingsChanged()
					).toBe( false );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveSettingsChanged()
					).toBe( false );
				} );

				it( 'should surface analytics-4 errors if it fails', async () => {
					const propertyID = '1000';
					const ga4Settings = {
						...ga4fixtures.defaultSettings,
						propertyID,
						webDataStreamID: '2000',
					};

					fetchMock.postOnce( gaSettingsEndpoint, {
						body: validSettings,
						status: 200,
					} );
					fetchMock.postOnce( ga4SettingsEndpoint, {
						body: error,
						status: 500,
					} );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setSettings( ga4Settings );

					expect(
						registry
							.select( MODULES_ANALYTICS )
							.haveSettingsChanged()
					).toBe( true );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveSettingsChanged()
					).toBe( true );

					const { error: saveChangesError } = await registry
						.dispatch( MODULES_ANALYTICS )
						.submitChanges();
					expect( saveChangesError ).toEqual( error );

					expect( fetchMock ).toHaveFetched( gaSettingsEndpoint, {
						body: { data: validSettings },
					} );
					expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
						body: { data: ga4Settings },
					} );

					expect(
						registry
							.select( MODULES_ANALYTICS )
							.haveSettingsChanged()
					).toBe( false );
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.haveSettingsChanged()
					).toBe( true );

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getErrorForAction( 'submitChanges' )
					).toEqual( error );
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
						const ga4Settings = {
							...ga4fixtures.defaultSettings,
							propertyID,
							webDataStreamID,
						};

						fetchMock.postOnce( gaSettingsEndpoint, {
							body: validSettings,
						} );
						fetchMock.postOnce( ga4SettingsEndpoint, {
							body: ga4Settings,
						} );

						registry
							.dispatch( MODULES_ANALYTICS_4 )
							.setSettings( ga4Settings );

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

						fetchMock.postOnce(
							enhancedMeasurementSettingsEndpoint,
							{
								status: 200,
								body: enabledSettingsMock,
							}
						);
					} );

					it( 'should save the enhanced measurement settings if the setting has been changed', async () => {
						await registry
							.dispatch( MODULES_ANALYTICS )
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
						expect(
							registry
								.select( MODULES_ANALYTICS_4 )
								.haveEnhancedMeasurementSettingsChanged(
									propertyID,
									webDataStreamID
								)
						).toBe( false );
					} );

					it( 'should not save the enhanced measurement settings if the form value is not defined', async () => {
						registry
							.dispatch( CORE_FORMS )
							.setValues( ENHANCED_MEASUREMENT_FORM, {
								[ ENHANCED_MEASUREMENT_ENABLED ]: undefined,
							} );

						await registry
							.dispatch( MODULES_ANALYTICS )
							.submitChanges();

						expect( fetchMock ).not.toHaveFetched(
							enhancedMeasurementSettingsEndpoint
						);
					} );

					it( 'should not save the enhanced measurement settings if the form value is `false`', async () => {
						registry
							.dispatch( CORE_FORMS )
							.setValues( ENHANCED_MEASUREMENT_FORM, {
								[ ENHANCED_MEASUREMENT_ENABLED ]: false,
							} );

						await registry
							.dispatch( MODULES_ANALYTICS )
							.submitChanges();

						expect( fetchMock ).not.toHaveFetched(
							enhancedMeasurementSettingsEndpoint
						);
					} );

					it( 'should not save the enhanced measurement settings if the setting has not been changed', async () => {
						registry
							.dispatch( MODULES_ANALYTICS_4 )
							.receiveGetEnhancedMeasurementSettings(
								enabledSettingsMock,
								{ propertyID, webDataStreamID }
							);

						await registry
							.dispatch( MODULES_ANALYTICS )
							.submitChanges();

						expect( fetchMock ).not.toHaveFetched(
							enhancedMeasurementSettingsEndpoint
						);
					} );

					it( 'should handle and return an error when saving enhanced measurement settings', async () => {
						const errorObject = {
							code: 'internal_error',
							message: 'Something wrong happened.',
							data: { status: 500 },
						};

						fetchMock.reset();

						fetchMock.postOnce(
							enhancedMeasurementSettingsEndpoint,
							{
								status: 500,
								body: errorObject,
							}
						);

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
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'sets internal state while submitting changes', async () => {
				const fetchDismissTourRegExp = new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-tour'
				);

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetSettings( validSettings );
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );
				expect(
					registry.select( MODULES_ANALYTICS ).haveSettingsChanged()
				).toBe( false );

				expect(
					registry.select( MODULES_ANALYTICS ).isDoingSubmitChanges()
				).toBe( false );

				fetchMock.postOnce( fetchDismissTourRegExp, {
					body: [ ga4ReportingTour.slug ],
				} );

				registry.dispatch( MODULES_ANALYTICS ).submitChanges();

				expect(
					registry.select( MODULES_ANALYTICS ).isDoingSubmitChanges()
				).toBe( true );

				await subscribeUntil(
					registry,
					() =>
						registry.stores[ MODULES_ANALYTICS ].store.getState()
							.isDoingSubmitChanges === false
				);

				expect(
					registry.select( MODULES_ANALYTICS ).isDoingSubmitChanges()
				).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			describe( 'required changes', () => {
				const propertyID = '1000';
				const webDataStreamID = '2000';

				beforeEach( () => {
					// Recreate the registry to ensure a clean settings state.
					registry = createTestRegistry();

					provideModules( registry, [
						{
							slug: 'analytics',
							active: true,
							connected: true,
						},
						{
							slug: 'analytics-4',
							active: true,
							connected: false,
						},
					] );

					registry
						.dispatch( MODULES_ANALYTICS )
						.receiveGetSettings( validSettings );

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

				it( 'requires a change to analytics or analytics-4 settings to have been made', () => {
					expect(
						registry.select( MODULES_ANALYTICS ).canSubmitChanges()
					).toBe( false );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
							.__dangerousCanSubmitChanges()
					).toThrow( INVARIANT_SETTINGS_NOT_CHANGED );
				} );

				it( 'accepts a change to analytics settings as a valid change', () => {
					registry
						.dispatch( MODULES_ANALYTICS )
						.setSettings( { accountID: '1000' } );

					expect(
						registry.select( MODULES_ANALYTICS ).canSubmitChanges()
					).toBe( true );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
							.__dangerousCanSubmitChanges()
					).not.toThrow();
				} );

				it( 'accepts a change to analytics-4 settings as a valid change', () => {
					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '1001',
					} );

					expect(
						registry.select( MODULES_ANALYTICS ).canSubmitChanges()
					).toBe( true );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
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
						registry.select( MODULES_ANALYTICS ).canSubmitChanges()
					).toBe( true );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
							.__dangerousCanSubmitChanges()
					).not.toThrow();
				} );
			} );

			it( 'requires a valid accountID', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_ANALYTICS ).setAccountID( '0' );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_ACCOUNT_ID );
			} );

			it( 'requires a valid propertyID', () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_ANALYTICS ).setPropertyID( '0' );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROPERTY_SELECTION );
			} );

			it( 'requires a valid profileID', () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				registry.dispatch( MODULES_ANALYTICS ).setProfileID( '0' );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROFILE_SELECTION );
			} );

			it( 'does not require a valid propertyID', () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					propertyID: null,
				} );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'does not require a valid profileID when the `enableUA` form value is false', () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					profileID: null,
				} );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'does not require a valid internalWebPropertyID when the `enableUA` form value is false', () => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					internalWebPropertyID: null,
				} );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'requires a valid adsConversionID when provided', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( tagWithPermission.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setAdsConversionID( '12345' );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_CONVERSION_ID );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setAdsConversionID( 'AW-12345' );
				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'does not require permissions for an existing tag', () => {
				const existingTag = {
					accountID: '999999',
					propertyID: 'UA-999999-1',
				};
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					...validSettings,
					...existingTag, // Set automatically in resolver.
				} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( existingTag.propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).not.toThrow();
			} );

			it( 'supports creating a property', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setPropertyID( PROPERTY_CREATE );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'supports creating a profile', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( PROFILE_CREATE );
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					profileName: 'all web site data',
				} );

				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBeTruthy();
			} );

			it( 'should not support creating a new profile when the profile name is empty', () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( PROFILE_CREATE );
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { profileName: '' } );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROFILE_NAME );
			} );

			it( 'should not support creating a new profile when the profile name is not set at all', () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableUA: true } );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( PROFILE_CREATE );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROFILE_NAME );
			} );

			it( 'does not require a valid profile name when the `enableUA` form value is false', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( PROFILE_CREATE );

				// Ensure the validation is not triggered when the profile name is not set at all.
				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );

				// Set an invalid/empty profile name.
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { profileName: '' } );

				// Ensure the validation is not triggered when an empty profile name is set.
				expect(
					registry.select( MODULES_ANALYTICS ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'does not support creating an account', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( ACCOUNT_CREATE );

				expect( () =>
					registry
						.select( MODULES_ANALYTICS )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_ACCOUNT_ID );
			} );

			describe( 'analytics-4', () => {
				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS )
						.receiveGetExistingTag( null );
					registry
						.dispatch( MODULES_ANALYTICS )
						.setSettings( validSettings );

					provideModules( registry, [
						{
							slug: 'analytics',
							active: true,
							connected: true,
						},
						{
							slug: 'analytics-4',
							active: true,
							connected: true,
						},
					] );
				} );

				it( 'should throw an error if analytics-4 settings are invalid', () => {
					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '123456',
						webDataStreamID: '',
					} );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
							.__dangerousCanSubmitChanges()
					).toThrow( INVARIANT_INVALID_WEBDATASTREAM_ID );
				} );

				it( 'should not throw if all settings are valid', () => {
					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						propertyID: '1000',
						webDataStreamID: '2000',
					} );

					expect( () =>
						registry
							.select( MODULES_ANALYTICS )
							.__dangerousCanSubmitChanges()
					).not.toThrow();
				} );
			} );
		} );

		describe( 'getCanUseSnippet', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setSettings( validSettings );
			} );
			it( 'should return the value from analytics settings if tag manager is not available', () => {
				const { ...modules } = registry
					.select( CORE_MODULES )
					.getModules();
				delete modules.tagmanager;
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( Object.values( modules ) );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( validSettings.canUseSnippet );
			} );

			it( 'should return the value from analytics settings if tag manager is not connected', () => {
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: false,
					},
				] );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( validSettings.canUseSnippet );
			} );

			it( 'should return the value from analytics settings if tag manager useSnippet is false', () => {
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: true,
					},
				] );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setSettings( { useSnippet: false } );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( validSettings.canUseSnippet );
			} );

			it( 'should return the value from analytics settings if there is no GA property in tag manager', () => {
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: true,
					},
				] );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setSettings( { useSnippet: true } );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( validSettings.canUseSnippet );
			} );

			it( 'should return `true` if GA property in tag manager is not the same as analytics', () => {
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
					useSnippet: true,
					gaPropertyID: 'UA-24680-1',
				} );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( true );
			} );

			it( 'should return `false` if GA property in tag manager is the same as analytics', () => {
				provideModules( registry, [
					{
						slug: 'tagmanager',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
					useSnippet: true,
					gaPropertyID: validSettings.propertyID,
				} );

				expect(
					registry.select( MODULES_ANALYTICS ).getCanUseSnippet()
				).toBe( false );
			} );
		} );
	} );
} );
