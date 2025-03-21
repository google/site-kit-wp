/**
 * `modules/analytics-4` data store: partial data tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	provideModules,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getPreviousDate, stringToDate } from '../../../util';
import { properties } from './__fixtures__';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS_4 } from './constants';
import { RESOURCE_TYPE_AUDIENCE } from './partial-data';

const testAudience1 = {
	name: 'properties/12345/audiences/12345',
};

const testAudience2 = {
	name: 'properties/12345/audiences/67890',
};

const testCustomDimension = 'googlesitekit_post_type';

const testAudience1ResourceName = testAudience1.name;
const testAudience2ResourceName = testAudience2.name;

const accountID = '100';
const property = properties[ 0 ];

const testPropertyID = property._id;

const resourceAvailabilityDates = {
	audience: {
		[ testAudience1ResourceName ]: 20201220,
	},
	customDimension: {
		[ testCustomDimension ]: 20201221,
	},
	property: {
		[ testPropertyID ]: 20201218,
	},
};

const saveResourceDataAvailabilityDate = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/save-resource-data-availability-date'
);

// TODO: use `replaceAll` instead of `replace` across the file when we upgrade our Node version.

describe( 'modules/analytics-4 partial data', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [ testCustomDimension ],
			propertyID: testPropertyID,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: [
				{
					name: testAudience1ResourceName,
				},
				{
					name: testAudience2ResourceName,
				},
			],
		} );
	} );

	describe( 'actions', () => {
		describe( 'receiveResourceDataAvailabilityDates', () => {
			it( 'requires resourceAvailabilityDates to be a plain object', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveResourceDataAvailabilityDates( 'test' );
				} ).toThrow(
					'resourceAvailabilityDates must be a plain object.'
				);
			} );

			it( 'receives a plain object and sets it as the resourceDataAvailabilityDates', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates(
						resourceAvailabilityDates
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDates()
				).toEqual( resourceAvailabilityDates );
			} );

			it( 'converts empty array to empty object', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: [],
						customDimension: [],
						property: {
							[ testPropertyID ]: 20201218,
						},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDates()
				).toEqual( {
					audience: {},
					customDimension: {},
					property: {
						[ testPropertyID ]: 20201218,
					},
				} );
			} );
		} );

		describe( 'setResourceDataAvailabilityDate', () => {
			it( 'requires resourceSlug to be a non-empty string', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setResourceDataAvailabilityDate( '' );
				} ).toThrow( 'resourceSlug must be a non-empty string.' );
			} );

			it( 'requires resourceType to be a valid resource type', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setResourceDataAvailabilityDate( 'test', 'invalid' );
				} ).toThrow( 'resourceType must be a valid resource type.' );
			} );

			it( 'requires date to be an integer', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setResourceDataAvailabilityDate(
							'test',
							RESOURCE_TYPE_AUDIENCE,
							'2020-20-20'
						);
				} ).toThrow( 'date must be an integer.' );
			} );

			it( 'sets the date for the resource', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setResourceDataAvailabilityDate(
						testAudience1ResourceName,
						RESOURCE_TYPE_AUDIENCE,
						20201220
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toEqual( 20201220 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getResourceDataAvailabilityDates', () => {
			it( 'uses a resolver to read data from _googlesitekitModulesData', async () => {
				global._googlesitekitModulesData = {
					'analytics-4': {
						resourceAvailabilityDates,
					},
				};

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDates()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getResourceDataAvailabilityDates();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDates()
				).toEqual( resourceAvailabilityDates );
			} );

			global._googlesitekitModulesData = undefined;
		} );

		describe( 'getResourceDataAvailabilityDate', () => {
			it( 'returns the date for the resource', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates(
						resourceAvailabilityDates
					);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toEqual( 20201220 );
			} );

			it( 'uses a resolver to determine the date and if the date is available, saves it to server', async () => {
				fetchMock.postOnce( saveResourceDataAvailabilityDate, {
					body: true,
					status: 200,
				} );

				provideUserAuthentication( registry );
				const referenceDate = registry
					.select( CORE_USER )
					.getReferenceDate();

				const createDate = getPreviousDate( referenceDate, 30 );

				const dataAvailabilityDate = getPreviousDate(
					referenceDate,
					15
				).replace( /-/g, '' );
				const createTime = stringToDate( createDate ).toISOString();

				const mockReport = {
					rows: [
						{
							dimensionValues: [
								{
									value: dataAvailabilityDate,
								},
							],
						},
					],
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( [ { ...property, createTime } ], {
						accountID,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates(
						resourceAvailabilityDates
					);

				registry
					.select( MODULES_ANALYTICS_4 )
					.getPartialDataReportOptions(
						testAudience2ResourceName,
						RESOURCE_TYPE_AUDIENCE
					);

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPartialDataReportOptions(
					testAudience2ResourceName,
					RESOURCE_TYPE_AUDIENCE
				);

				const reportArgs = registry
					.select( MODULES_ANALYTICS_4 )
					.getPartialDataReportOptions(
						testAudience2ResourceName,
						RESOURCE_TYPE_AUDIENCE
					);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( mockReport, { options: reportArgs } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience2ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getResourceDataAvailabilityDate(
					testAudience2ResourceName,
					RESOURCE_TYPE_AUDIENCE
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience2ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toEqual( Number( dataAvailabilityDate ) );
			} );

			it( 'uses a resolver to determine the date and if the date is not available, returns 0', async () => {
				provideUserAuthentication( registry );
				const referenceDate = registry
					.select( CORE_USER )
					.getReferenceDate();

				const createDate = getPreviousDate( referenceDate, 30 );
				const createTime = stringToDate( createDate ).toISOString();

				const mockReport = {
					rows: [
						{
							dimensionValues: [],
						},
					],
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( [ { ...property, createTime } ], {
						accountID,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates(
						resourceAvailabilityDates
					);

				registry
					.select( MODULES_ANALYTICS_4 )
					.getPartialDataReportOptions(
						testAudience2ResourceName,
						RESOURCE_TYPE_AUDIENCE
					);

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPartialDataReportOptions(
					testAudience2ResourceName,
					RESOURCE_TYPE_AUDIENCE
				);

				const reportArgs = registry
					.select( MODULES_ANALYTICS_4 )
					.getPartialDataReportOptions(
						testAudience2ResourceName,
						RESOURCE_TYPE_AUDIENCE
					);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( mockReport, { options: reportArgs } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience2ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getResourceDataAvailabilityDate(
					testAudience2ResourceName,
					RESOURCE_TYPE_AUDIENCE
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getResourceDataAvailabilityDate(
							testAudience2ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toEqual( 0 );
			} );
		} );

		describe( 'isResourcePartialData', () => {
			it( 'requires resourceSlug to be a non-empty string', () => {
				expect( () => {
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData( '', RESOURCE_TYPE_AUDIENCE );
				} ).toThrow( 'resourceSlug must be a non-empty string.' );
			} );

			it( 'requires resourceType to be a valid resource type', () => {
				expect( () => {
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData( 'test', 'invalid' );
				} ).toThrow( 'resourceType must be a valid resource type.' );
			} );

			it( 'returns true if analytics is gathering data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( true );
			} );

			it( 'returns true if the resource data is not available', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {
							[ testAudience1ResourceName ]: 0,
						},
						customDimension: {},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( true );
			} );

			it( 'returns false if the resource data availability date is earlier than the start date of selected date range', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const audience1Date = Number( startDate.replace( /-/g, '' ) );
				const audience2Date = Number(
					getPreviousDate( startDate, 1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {
							[ testAudience1ResourceName ]: audience1Date,
							[ testAudience2ResourceName ]: audience2Date,
						},
						customDimension: {},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( false );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience2ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( false );
			} );

			it( 'returns true if the resource data availability date is later than the start date of selected date range', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const dataAvailabilityDate = Number(
					getPreviousDate( startDate, -1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {
							[ testAudience1ResourceName ]: dataAvailabilityDate,
						},
						customDimension: {},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( true );
			} );

			it( 'dynamically determines if the resource is in partial data based on the selected date range', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const dataAvailabilityDate = Number(
					getPreviousDate( startDate, -1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {
							[ testAudience1ResourceName ]: dataAvailabilityDate,
						},
						customDimension: {},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( true );

				registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isResourcePartialData(
							testAudience1ResourceName,
							RESOURCE_TYPE_AUDIENCE
						)
				).toBe( false );
			} );
		} );

		describe( 'isAudiencePartialData', () => {
			it( 'returns whether the given auduence is in partial data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const dataAvailabilityDate = Number(
					getPreviousDate( startDate, -1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {
							[ testAudience1ResourceName ]: dataAvailabilityDate,
						},
						customDimension: {},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAudiencePartialData( testAudience1ResourceName )
				).toBe( true );

				registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAudiencePartialData( testAudience1ResourceName )
				).toBe( false );
			} );
		} );

		describe( 'isCustomDimensionPartialData', () => {
			it( 'returns whether the given custom dimension is in partial data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const dataAvailabilityDate = Number(
					getPreviousDate( startDate, -1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {},
						customDimension: {
							[ testCustomDimension ]: dataAvailabilityDate,
						},
						property: {},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionPartialData( testCustomDimension )
				).toBe( true );

				registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isCustomDimensionPartialData( testCustomDimension )
				).toBe( false );
			} );
		} );

		describe( 'isPropertyPartialData', () => {
			it( 'returns whether the given property is in partial data', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				const { startDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				const dataAvailabilityDate = Number(
					getPreviousDate( startDate, -1 ).replace( /-/g, '' )
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: {},
						customDimension: {},
						property: {
							[ testPropertyID ]: dataAvailabilityDate,
						},
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isPropertyPartialData( testPropertyID )
				).toBe( true );

				registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isPropertyPartialData( testPropertyID )
				).toBe( false );
			} );
		} );
	} );
} );
