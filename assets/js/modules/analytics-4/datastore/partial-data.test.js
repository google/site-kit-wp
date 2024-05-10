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
import {
	properties,
	availableAudiences as availableAudiencesFixture,
} from './__fixtures__';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from './constants';
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
			availableAudiences: [ testAudience1, testAudience2 ],
			availableCustomDimensions: [ testCustomDimension ],
			propertyID: testPropertyID,
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

		describe( 'enableAudienceGroup', () => {
			const audienceSettingsEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
			);
			const createAudienceEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
			);
			const syncAvailableAudiencesEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
			);

			const referenceDate = '2024-05-10';
			const startDate = '2024-02-09'; // 91 days before `referenceDate`.

			const availableNewVisitorsAudienceFixture =
				availableAudiencesFixture[ 2 ];
			const availableReturningVisitorsAudienceFixture =
				availableAudiencesFixture[ 3 ];
			const availableUserAudienceFixture = availableAudiencesFixture[ 4 ];

			// The fixture only contains one user audience. Create another two so we can test the filtering and sorting.
			const availableUserAudiences = [
				availableUserAudienceFixture,
				createAvailableUserAudience( 6 ),
				createAvailableUserAudience( 7 ),
			];

			const isAudienceSegmentationWidgetHidden = false;

			function createAvailableUserAudience( audienceID ) {
				return {
					name: `properties/12345/audiences/${ audienceID }`,
					description: `Description ${ audienceID }`,
					displayName: `Test Audience ${ audienceID }`,
					audienceType: 'USER_AUDIENCE',
					audienceSlug: '',
				};
			}

			function getReportOptions( audiences ) {
				return {
					metrics: [ { name: 'totalUsers' } ],
					dimensions: [ 'audienceResourceName' ],
					dimensionFilters: {
						audienceResourceName: audiences.map(
							( { name } ) => name
						),
					},
					startDate,
					endDate: referenceDate,
				};
			}

			function createMockReport( totalUsersByAudience ) {
				return {
					kind: 'analyticsData#runReport',
					rowCount: 3,
					dimensionHeaders: [
						{
							name: 'audienceResourceName',
						},
					],
					metricHeaders: [
						{
							name: 'totalUsers',
							type: 'TYPE_INTEGER',
						},
					],
					rows: Object.entries( totalUsersByAudience ).map(
						( [ audienceResourceName, totalUsers ] ) => ( {
							dimensionValues: [
								{
									value: audienceResourceName,
								},
							],
							metricValues: [
								{
									value: totalUsers,
								},
							],
						} )
					),
					totals: [
						{
							dimensionValues: [
								{
									value: 'RESERVED_TOTAL',
								},
							],
							metricValues: [
								{
									value: Object.values( totalUsersByAudience )
										.reduce(
											( acc, totalUsers ) =>
												acc + totalUsers,
											0
										)
										.toString(),
								},
							],
						},
					],
					maximums: [
						{
							dimensionValues: [
								{
									value: 'RESERVED_MAX',
								},
							],
							metricValues: [
								{
									value: Math.max(
										...Object.values( totalUsersByAudience )
									).toString(),
								},
							],
						},
					],
					minimums: [
						{
							dimensionValues: [
								{
									value: 'RESERVED_MIN',
								},
							],
							metricValues: [
								{
									value: Math.min(
										...Object.values( totalUsersByAudience )
									).toString(),
								},
							],
						},
					],
					metadata: {
						currencyCode: 'USD',
						dataLossFromOtherRow: null,
						emptyReason: null,
						subjectToThresholding: null,
						timeZone: 'Etc/UTC',
					},
				};
			}

			beforeEach( () => {
				registry
					.dispatch( CORE_USER )
					.setReferenceDate( referenceDate );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						configuredAudiences: null,
						isAudienceSegmentationWidgetHidden,
					} );
			} );

			it( 'syncs `availableAudiences`', async () => {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiencesFixture,
					status: 200,
				} );

				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: {
						configuredAudiences: [
							availableUserAudienceFixture.name,
						],
						isAudienceSegmentationWidgetHidden,
					},
					status: 200,
				} );

				const options = getReportOptions( [
					availableUserAudienceFixture,
				] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( {}, { options } );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ options ] );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.enableAudienceGroup();

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					syncAvailableAudiencesEndpoint
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toEqual( availableAudiencesFixture );
			} );

			it.each( [
				[
					'the top 1 from 1 of 3 candidate user audiences with data over the past 90 days', // Test description differentiator.
					{
						totalUsersByAudience: {
							[ availableUserAudiences[ 0 ].name ]: 0,
							[ availableUserAudiences[ 1 ].name ]: 0,
							[ availableUserAudiences[ 2 ].name ]: 123,
						},
						expectedConfiguredAudiences: [
							availableUserAudiences[ 2 ].name,
						],
					},
				],
				[
					'the top 2 from 2 of 3 candidate user audiences with data over the past 90 days',
					{
						totalUsersByAudience: {
							[ availableUserAudiences[ 0 ].name ]: 10,
							[ availableUserAudiences[ 1 ].name ]: 0,
							[ availableUserAudiences[ 2 ].name ]: 123,
						},
						expectedConfiguredAudiences: [
							availableUserAudiences[ 2 ].name,
							availableUserAudiences[ 0 ].name,
						],
					},
				],
				[
					'the top 2 from 3 of 3 candidate user audiences with data over the past 90 days',
					{
						totalUsersByAudience: {
							[ availableUserAudiences[ 0 ].name ]: 20,
							[ availableUserAudiences[ 1 ].name ]: 10,
							[ availableUserAudiences[ 2 ].name ]: 123,
						},
						expectedConfiguredAudiences: [
							availableUserAudiences[ 2 ].name,
							availableUserAudiences[ 0 ].name,
						],
					},
				],
			] )(
				'adds %s to `configuredAudiences`, sorted by user count',
				async (
					_,
					{ totalUsersByAudience, expectedConfiguredAudiences }
				) => {
					fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
						body: availableUserAudiences,
						status: 200,
					} );

					fetchMock.postOnce( audienceSettingsEndpoint, {
						body: {
							configuredAudiences: expectedConfiguredAudiences,
							isAudienceSegmentationWidgetHidden,
						},
						status: 200,
					} );

					const options = getReportOptions( availableUserAudiences );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport(
							createMockReport( totalUsersByAudience ),
							{ options }
						);

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.finishResolution( 'getReport', [ options ] );

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.enableAudienceGroup();

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						audienceSettingsEndpoint,
						{
							body: {
								data: {
									settings: {
										configuredAudiences:
											expectedConfiguredAudiences,
										isAudienceSegmentationWidgetHidden,
									},
								},
							},
						}
					);

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getConfiguredAudiences()
					).toEqual( expectedConfiguredAudiences );
				}
			);

			it.each( [
				[
					'"new visitors" audience',
					{
						totalUsersByAudience: {
							[ availableUserAudiences[ 0 ].name ]: 0,
							[ availableUserAudiences[ 1 ].name ]: 0,
							[ availableUserAudiences[ 2 ].name ]: 123,
						},
						expectedConfiguredAudiences: [
							availableUserAudiences[ 2 ].name,
							availableNewVisitorsAudienceFixture.name,
						],
					},
				],
				[
					'"new visitors" and "returning visitors" audiences',
					{
						totalUsersByAudience: {
							[ availableUserAudiences[ 0 ].name ]: 0,
							[ availableUserAudiences[ 1 ].name ]: 0,
							[ availableUserAudiences[ 2 ].name ]: 0,
						},
						expectedConfiguredAudiences: [
							availableNewVisitorsAudienceFixture.name,
							availableReturningVisitorsAudienceFixture.name,
						],
					},
				],
			] )(
				'fills available space in `configuredAudiences` with pre-existing %s',
				async (
					_,
					{ totalUsersByAudience, expectedConfiguredAudiences }
				) => {
					fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
						body: [
							...availableAudiencesFixture,
							...availableUserAudiences.slice( 1 ),
						],
						status: 200,
					} );

					fetchMock.postOnce( audienceSettingsEndpoint, {
						body: {
							configuredAudiences: expectedConfiguredAudiences,
							isAudienceSegmentationWidgetHidden,
						},
						status: 200,
					} );

					const options = getReportOptions( availableUserAudiences );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport(
							createMockReport( totalUsersByAudience ),
							{ options }
						);

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.finishResolution( 'getReport', [ options ] );

					await registry
						.dispatch( MODULES_ANALYTICS_4 )
						.enableAudienceGroup();

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						audienceSettingsEndpoint,
						{
							body: {
								data: {
									settings: {
										configuredAudiences:
											expectedConfiguredAudiences,
										isAudienceSegmentationWidgetHidden,
									},
								},
							},
						}
					);

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getConfiguredAudiences()
					).toEqual( expectedConfiguredAudiences );
				}
			);

			it( 'creates the "new visitors" and "returning visitors" audiences, and adds them to `configuredAudiences` if they do not exist and no suitable pre-existing audiences are present to populate `configuredAudiences`', async () => {
				const createdNewVisitorsAudienceName =
					'properties/12345/audiences/888';
				const createdReturningVisitorsAudienceName =
					'properties/12345/audiences/999';

				const finalAvailableAudiences = [
					[
						...availableAudiencesFixture,
						{
							...availableNewVisitorsAudienceFixture,
							name: createdNewVisitorsAudienceName,
						},
						{
							...availableReturningVisitorsAudienceFixture,
							name: createdReturningVisitorsAudienceName,
						},
					],
				];

				fetchMock.post(
					{
						url: syncAvailableAudiencesEndpoint,
						repeat: 2,
					},
					() => {
						const callCount = fetchMock.calls(
							syncAvailableAudiencesEndpoint
						).length;

						return {
							body:
								callCount === 1
									? availableUserAudiences
									: finalAvailableAudiences,
							status: 200,
						};
					}
				);

				const expectedConfiguredAudiences = [
					createdNewVisitorsAudienceName,
					createdReturningVisitorsAudienceName,
				];

				fetchMock.postOnce( audienceSettingsEndpoint, {
					body: {
						configuredAudiences: expectedConfiguredAudiences,
						isAudienceSegmentationWidgetHidden,
					},
					status: 200,
				} );

				fetchMock.post(
					{ url: createAudienceEndpoint, repeat: 2 },
					( url, opts ) => {
						return {
							body: opts.body.includes( 'new_visitors' )
								? {
										...SITE_KIT_AUDIENCE_DEFINITIONS[
											'new-visitors'
										],
										name: createdNewVisitorsAudienceName,
								  }
								: {
										...SITE_KIT_AUDIENCE_DEFINITIONS[
											'returning-visitors'
										],
										name: createdReturningVisitorsAudienceName,
								  },
							status: 200,
						};
					}
				);

				const options = getReportOptions( availableUserAudiences );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
					createMockReport( {
						[ availableUserAudiences[ 0 ].name ]: 0,
						[ availableUserAudiences[ 1 ].name ]: 0,
						[ availableUserAudiences[ 2 ].name ]: 0,
					} ),
					{ options }
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ options ] );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.enableAudienceGroup();

				expect( fetchMock ).toHaveFetchedTimes(
					2,
					syncAvailableAudiencesEndpoint
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toEqual( finalAvailableAudiences );

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					createAudienceEndpoint,
					{
						body: {
							data: {
								audience:
									SITE_KIT_AUDIENCE_DEFINITIONS[
										'new-visitors'
									],
							},
						},
					}
				);

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					createAudienceEndpoint,
					{
						body: {
							data: {
								audience:
									SITE_KIT_AUDIENCE_DEFINITIONS[
										'returning-visitors'
									],
							},
						},
					}
				);

				expect( fetchMock ).toHaveFetchedTimes(
					1,
					audienceSettingsEndpoint,
					{
						body: {
							data: {
								settings: {
									configuredAudiences:
										expectedConfiguredAudiences,
									isAudienceSegmentationWidgetHidden,
								},
							},
						},
					}
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConfiguredAudiences()
				).toEqual( expectedConfiguredAudiences );
			} );

			it( "syncs `availableCustomDimensions if it's not already synced", () => {} );

			it( "creates the `googlesitekit_post_type` custom dimension if it doesn't exist", () => {} );
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
