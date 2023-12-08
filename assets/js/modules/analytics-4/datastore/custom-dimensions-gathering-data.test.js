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
import { MODULES_ANALYTICS_4 } from './constants';
import { getPreviousDate, stringToDate } from '../../../util';

let {
	createTestRegistry,
	untilResolved,
	provideUserAuthentication,
	muteFetch,
	provideModules,
} = require( '../../../../../tests/js/utils' );

describe( 'modules/analytics-4 custom-dimensions-gathering-data', () => {
	const customDimension = 'googlesitekit_post_author';

	function setupRegistry( registry ) {
		provideUserAuthentication( registry );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [ customDimension ],
		} );
	}

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();

		setupRegistry( registry );

		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
	} );

	describe( 'actions', () => {
		describe( 'receiveIsCustomDimensionGatheringData', () => {
			it( 'requires a string for the parameter name', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveIsCustomDimensionGatheringData()
				).toThrow( 'customDimension must be a non-empty string' );
			} );

			it( 'requires a boolean for the gathering data state to receive', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveIsCustomDimensionGatheringData(
							customDimension
						)
				).toThrow( 'gatheringData must be a boolean' );
			} );

			it( 'receives a `true` gathering data state', () => {
				expect(
					store.getState().customDimensionsGatheringData[
						customDimension
					]
				).toBeUndefined();

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						customDimension,
						true
					);

				expect(
					store.getState().customDimensionsGatheringData[
						customDimension
					]
				).toBe( true );
			} );

			it( 'receives a `false` gathering data state', () => {
				expect(
					store.getState().customDimensionsGatheringData[
						customDimension
					]
				).toBeUndefined();

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						customDimension,
						false
					);

				expect(
					store.getState().customDimensionsGatheringData[
						customDimension
					]
				).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		const defaultProperty = properties[ 0 ];
		const defaultPropertyID = defaultProperty._id;
		const accountID = '100';

		const customDimensionDataAvailableEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/custom-dimension-data-available'
		);

		const dataAvailabilityReportWithData = {
			dimensionHeaders: [
				{
					name: `customEvent:${ customDimension }`,
				},
			],
			metricHeaders: [
				{
					name: 'eventCount',
					type: 'TYPE_INTEGER',
				},
			],
			rows: [
				{
					dimensionValues: [
						{
							value: '(not set)',
						},
					],
					metricValues: [
						{
							value: '123',
						},
					],
				},
				{
					dimensionValues: [
						{
							value: '123',
						},
					],
					metricValues: [
						{
							value: '456',
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

		const dataAvailabilityReportWithNoRows = {
			kind: 'analyticsData#runReport',
			rowCount: null,
			dimensionHeaders: [
				{
					name: `customEvent:${ customDimension }`,
				},
			],
			metricHeaders: [
				{
					name: 'eventCount',
					type: 'TYPE_INTEGER',
				},
			],
			totals: [ {} ],
			maximums: [ {} ],
			minimums: [ {} ],
			metadata: {
				currencyCode: 'USD',
				dataLossFromOtherRow: null,
				emptyReason: null,
				subjectToThresholding: null,
				timeZone: 'Europe/London',
			},
		};

		const dataAvailabilityReportWithNoSetValues = {
			dimensionHeaders: [
				{
					name: `customEvent:${ customDimension }`,
				},
			],
			metricHeaders: [
				{
					name: 'eventCount',
					type: 'TYPE_INTEGER',
				},
			],
			rows: [
				{
					dimensionValues: [
						{
							value: '(not set)',
						},
					],
					metricValues: [
						{
							value: '123',
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
						[ customDimension ]: dataAvailable,
					},
				},
			};

			( {
				createTestRegistry,
				untilResolved,
				provideUserAuthentication,
				muteFetch,
			} = require( '../../../../../tests/js/utils' ) );

			registry = createTestRegistry();

			setupRegistry( registry );
		}

		function setupCustomDimensionDataAvailability( options = {} ) {
			const defaultOptions = {
				authenticated: true,
				propertyID: defaultPropertyID,
				property: defaultProperty,
				availableCustomDimensions: [ customDimension ],
				report: dataAvailabilityReportWithData,
			};

			const {
				authenticated,
				propertyID,
				property,
				availableCustomDimensions,
				report,
				reportError,
			} = { ...defaultOptions, ...options };

			if ( authenticated !== undefined ) {
				provideUserAuthentication( registry, { authenticated } );
			}

			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
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

			if ( report || reportError ) {
				const reportArgs = {
					startDate: createDate,
					endDate: referenceDate,
					dimensions: [ `customEvent:${ customDimension }` ],
					metrics: [ { name: 'eventCount' } ],
					limit: 2,
				};

				if ( report ) {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport( report, { options: reportArgs } );
				}

				if ( reportError ) {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveError( report, 'getReport', [ reportArgs ] );
				}

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ reportArgs ] );
			}
		}

		describe( 'checkCustomDimensionDataAvailability', () => {
			it( 'should set gathering data to be FALSE and dispatch a fetch request to save it when data is available', async () => {
				setupCustomDimensionDataAvailability();

				fetchMock.postOnce( customDimensionDataAvailableEndpoint, {
					body: true,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.checkCustomDimensionDataAvailability( customDimension );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBe( false );

				expect( fetchMock ).toHaveFetched(
					customDimensionDataAvailableEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it.each( [
				[
					'the custom dimension is not available',
					() => {
						setupCustomDimensionDataAvailability( {
							availableCustomDimensions: [],
						} );
					},
				],
				[
					'the user is not authenticated',
					() => {
						setupCustomDimensionDataAvailability( {
							authenticated: false,
						} );
					},
				],
				[
					'the property ID is not set',
					() => {
						setupCustomDimensionDataAvailability( {
							propertyID: undefined,
						} );
					},
				],
				[
					'the report returns an error',
					() => {
						setupCustomDimensionDataAvailability( {
							reportError: {
								code: 'test_error',
								message: 'Error message.',
								data: {},
							},
						} );

						muteFetch(
							new RegExp(
								'^/google-site-kit/v1/modules/analytics-4/data/report'
							)
						);
					},
				],
				[
					'the report contains no rows',
					() => {
						setupCustomDimensionDataAvailability( {
							report: dataAvailabilityReportWithNoRows,
						} );
					},
				],
				[
					'the report contains no set values',
					() => {
						setupCustomDimensionDataAvailability( {
							report: dataAvailabilityReportWithNoSetValues,
						} );
					},
				],
			] )(
				'should set gathering data to be TRUE and not dispatch a fetch request to save it when %s',
				async ( _, setupTest ) => {
					setupTest();

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.checkCustomDimensionDataAvailability(
							customDimension
						);

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isCustomDimensionGatheringData( customDimension )
					).toBe( true );
				}
			);
		} );

		describe( 'isCustomDimensionGatheringData', () => {
			it( 'should return undefined if it is not resolved yet', async () => {
				setupCustomDimensionDataAvailability();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBeUndefined();

				muteFetch( customDimensionDataAvailableEndpoint );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).isCustomDimensionGatheringData( customDimension );
			} );

			it( 'should return the value of gathering data if it is set and do nothing else', async () => {
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						customDimension,
						true
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBe( true );
			} );

			it( 'should return FALSE and do nothing else when data is available on load', async () => {
				setupRegistryWithDataAvailabilityOnLoad( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).isCustomDimensionGatheringData( customDimension );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBe( false );
			} );

			it( 'should set gathering data state and dispatch a fetch request to save it when the data availability check finds data', async () => {
				setupRegistryWithDataAvailabilityOnLoad( false );
				setupCustomDimensionDataAvailability();

				fetchMock.postOnce( customDimensionDataAvailableEndpoint, {
					body: true,
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).isCustomDimensionGatheringData( customDimension );

				expect( fetchMock ).toHaveFetched(
					customDimensionDataAvailableEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBe( false );
			} );

			it( 'should set gathering data state and do nothing else when the data availability check does not find data', async () => {
				setupRegistryWithDataAvailabilityOnLoad( false );
				setupCustomDimensionDataAvailability( {
					availableCustomDimensions: [],
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).isCustomDimensionGatheringData( customDimension );

				expect( fetchMock ).not.toHaveFetched();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionGatheringData( customDimension )
				).toBe( true );
			} );
		} );

		describe( 'areCustomDimensionGatheringData', () => {
			it( 'should return FALSE if none of the given custom dimensions are gathering data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_author',
						false
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_date',
						false
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.areCustomDimensionsGatheringData( [
							'googlesitekit_post_author',
							'googlesitekit_post_date',
						] )
				).toBe( false );
			} );

			it( 'should return TRUE if at least one of the given custom dimensions is gathering data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_author',
						false
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_date',
						true
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.areCustomDimensionsGatheringData( [
							'googlesitekit_post_author',
							'googlesitekit_post_date',
						] )
				).toBe( true );
			} );

			it( 'should return undefined if at least one of the given custom dimensions are not resolved yet', () => {
				// Include both a `true` and `false` gathering data state to show that `undefined` takes precedence over both.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_author',
						false
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsCustomDimensionGatheringData(
						'googlesitekit_post_date',
						true
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.areCustomDimensionsGatheringData( [
							'googlesitekit_post_author',
							'googlesitekit_post_date',
							'googlesitekit_post_categories',
						] )
				).toBeUndefined();
			} );
		} );
	} );
} );
