/**
 * Custom dimensions gathering data store tests.
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
import { properties } from './__fixtures__';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getPreviousDate, stringToDate } from '../../../util';
import { MODULES_ANALYTICS_4 } from './constants';

let {
	createTestRegistry,
	waitForDefaultTimeouts,
	provideUserAuthentication,
	muteFetch,
} = require( '../../../../../tests/js/utils' );

describe( 'modules/analytics-4 custom-dimensions-gathering-data', () => {
	let registry;
	let store;

	const parameterName = 'googlesitekit_post_author';

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
	} );

	describe( 'actions', () => {
		describe( 'receiveIsCustomDimensionGatheringData', () => {
			it( 'requires a string for the parameter name', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveIsCustomDimensionGatheringData()
				).toThrow( 'parameterName must be a string' );
			} );

			it( 'requires a boolean for the gathering data state to receive', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveIsCustomDimensionGatheringData( parameterName )
				).toThrow( 'gatheringData must be a boolean' );
			} );

			it( 'receives a `true` gathering data state', () => {
				expect(
					store.getState().customDimensionsGatheringData[
						parameterName
					]
				).toBeUndefined();

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						parameterName,
						true
					);

				expect(
					store.getState().customDimensionsGatheringData[
						parameterName
					]
				).toBe( true );
			} );

			it( 'receives a `false` gathering data state', () => {
				expect(
					store.getState().customDimensionsGatheringData[
						parameterName
					]
				).toBeUndefined();

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						parameterName,
						false
					);

				expect(
					store.getState().customDimensionsGatheringData[
						parameterName
					]
				).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		const defaultProperty = properties[ 0 ];
		const defaultPropertyID = defaultProperty._id;
		const accountID = '100';

		const dataAvailabilityReportWithData = {
			dimensionHeaders: [
				{
					name: `customEvent:${ parameterName }`,
				},
			],
			rows: [
				{
					dimensionValues: [
						{
							value: '(not set)',
						},
					],
				},
				{
					dimensionValues: [
						{
							value: '123',
						},
					],
				},
			],
			rowCount: 2,
			metadata: {
				currencyCode: 'USD',
				timeZone: 'Europe/London',
			},
			kind: 'analyticsData#runReport',
		};

		const dataAvailabilityReportWithoutData = {
			dimensionHeaders: [
				{
					name: `customEvent:${ parameterName }`,
				},
			],
			rows: [
				{
					dimensionValues: [
						{
							value: '(not set)',
						},
					],
				},
			],
			rowCount: 1,
			metadata: {
				currencyCode: 'USD',
				timeZone: 'Europe/London',
			},
			kind: 'analyticsData#runReport',
		};

		let previousSiteKitModulesData;

		beforeEach( () => {
			previousSiteKitModulesData = global._googlesitekitModulesData;
		} );

		afterEach( () => {
			global._googlesitekitModulesData = previousSiteKitModulesData;
		} );

		function setupRegistryWithDataAvailabilityOnLoad( dataAvailable ) {
			if ( dataAvailable === undefined ) {
				return;
			}

			jest.resetModules();

			global._googlesitekitModulesData = {
				'analytics-4': {
					customDimensionsDataAvailable: {
						[ parameterName ]: dataAvailable,
					},
				},
			};

			( {
				createTestRegistry,
				waitForDefaultTimeouts,
				provideUserAuthentication,
				muteFetch,
			} = require( '../../../../../tests/js/utils' ) );

			registry = createTestRegistry();
		}

		function setupCustomDimensionDataAvailability( options = {} ) {
			const defaultOptions = {
				authenticated: true,
				propertyID: defaultPropertyID,
				property: defaultProperty,
				availableCustomDimensions: [ parameterName ],
				report: dataAvailabilityReportWithData,
			};

			const {
				authenticated,
				propertyID,
				property,
				availableCustomDimensions,
				report,
			} = { ...defaultOptions, ...options };

			if ( authenticated !== undefined ) {
				provideUserAuthentication( registry, { authenticated } );
			}

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				propertyID,
				availableCustomDimensions,
			} );

			const referenceDate = registry
				.select( CORE_USER )
				.getReferenceDate();

			const createDate = getPreviousDate( referenceDate, 1 );
			const createTime = stringToDate( createDate ).toISOString();

			if ( property ) {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( [ { ...property, createTime } ], {
						accountID,
					} );
			}

			const reportArgs = {
				startDate: createDate,
				endDate: referenceDate,
				dimensions: [ `customEvent:${ parameterName }` ],
			};

			if ( report ) {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( report, {
						options: reportArgs,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ reportArgs ] );
			}
		}

		describe( 'selectCustomDimensionDataAvailability', () => {
			it( 'should return TRUE if data is available', () => {
				setupCustomDimensionDataAvailability();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.selectCustomDimensionDataAvailability( parameterName )
				).toBe( true );
			} );

			it.each( [
				[
					false,
					'the custom dimension is not available',
					() => {
						setupCustomDimensionDataAvailability( {
							availableCustomDimensions: [],
						} );
					},
				],
				[
					undefined,
					'authentication is not resolved',
					() => {
						setupCustomDimensionDataAvailability( {
							authenticated: undefined,
						} );

						muteFetch(
							new RegExp(
								'^/google-site-kit/v1/core/user/data/authentication'
							)
						);
					},
				],
				[
					false,
					'the user is not authenticated',
					() => {
						setupCustomDimensionDataAvailability( {
							authenticated: false,
						} );
					},
				],
				[
					undefined,
					'the property ID is not defined',
					() => {
						setupCustomDimensionDataAvailability( {
							propertyID: undefined,
						} );
					},
				],
				[
					undefined,
					'the property is not resolved',
					() => {
						setupCustomDimensionDataAvailability( {
							property: undefined,
						} );

						muteFetch(
							new RegExp(
								'^/google-site-kit/v1/modules/analytics-4/data/property'
							)
						);
					},
				],
				[
					undefined,
					'the report is not resolved',
					() => {
						setupCustomDimensionDataAvailability( {
							report: undefined,
						} );

						muteFetch(
							new RegExp(
								'^/google-site-kit/v1/modules/analytics-4/data/report'
							)
						);
					},
				],
				[
					false,
					'data is not available',
					() => {
						setupCustomDimensionDataAvailability( {
							report: dataAvailabilityReportWithoutData,
						} );
					},
				],
			] )(
				'should return %s if %s',
				async ( expectedValue, _, setupTest ) => {
					setupTest();

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.selectCustomDimensionDataAvailability(
								parameterName
							)
					).toBe( expectedValue );

					await waitForDefaultTimeouts();
				}
			);
		} );

		describe( 'isCustomDimensionDataAvailableOnLoad', () => {
			it( 'should return FALSE if data availability is not present on load', () => {
				setupRegistryWithDataAvailabilityOnLoad( undefined );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionDataAvailableOnLoad( parameterName )
				).toBe( false );
			} );

			it( 'should return FALSE if data availability is FALSE on load', () => {
				setupRegistryWithDataAvailabilityOnLoad( false );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionDataAvailableOnLoad( parameterName )
				).toBe( false );
			} );

			it( 'should return TRUE if data availability is TRUE on load', () => {
				setupRegistryWithDataAvailabilityOnLoad( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionDataAvailableOnLoad( parameterName )
				).toBe( true );
			} );
		} );
	} );
} );
