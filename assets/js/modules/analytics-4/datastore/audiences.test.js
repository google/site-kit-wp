/**
 * `modules/analytics-4` data store: audiences tests.
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
	freezeFetch,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import {
	AUDIENCE_FILTER_CLAUSE_TYPE_ENUM,
	AUDIENCE_FILTER_SCOPE_ENUM,
	CUSTOM_DIMENSION_DEFINITIONS,
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	properties as propertiesFixture,
	audiences as audiencesFixture,
	availableAudiences as availableAudiencesFixture,
} from './__fixtures__';
import fetchMock from 'fetch-mock';

describe( 'modules/analytics-4 audiences', () => {
	let registry;

	const createAudienceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	const audience = {
		displayName: 'Recently active users',
		description: 'Users that have been active in a recent period',
		membershipDurationDays: 30,
		filterClauses: [
			{
				clauseType: AUDIENCE_FILTER_CLAUSE_TYPE_ENUM.INCLUDE,
				simpleFilter: {
					scope: AUDIENCE_FILTER_SCOPE_ENUM.AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS,
					filterExpression: {
						andGroup: {
							filterExpressions: [
								{
									orGroup: {
										filterExpressions: [
											{
												dimensionOrMetricFilter: {
													atAnyPointInTime: null,
													fieldName: 'newVsReturning',
													inAnyNDayPeriod: null,
													stringFilter: {
														caseSensitive: null,
														matchType: 'EXACT',
														value: 'new',
													},
												},
											},
										],
									},
								},
							],
						},
					},
				},
			},
		],
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'createAudience', () => {
			it( 'should require a valid audience object', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.createAudience( [] )
				).toThrow( 'Audience must be an object.' );
			} );

			it( 'should contain only valid keys', () => {
				expect( () =>
					registry.dispatch( MODULES_ANALYTICS_4 ).createAudience( {
						displayName: 'Recently active users',
						description:
							'Users that have been active in a recent period',
						membershipDurationDays: 30,
						randomKey: '',
						filterClauses: [],
					} )
				).toThrow(
					'Audience object must contain only valid keys. Invalid key: "randomKey"'
				);
			} );

			it( 'should contain all required keys', () => {
				expect( () =>
					registry.dispatch( MODULES_ANALYTICS_4 ).createAudience( {
						displayName: 'Recently active users',
						membershipDurationDays: 30,
						filterClauses: [],
					} )
				).toThrow(
					'Audience object must contain required keys. Missing key: "description"'
				);
			} );

			it( 'should contain filterClauses property as an array', () => {
				expect( () =>
					registry.dispatch( MODULES_ANALYTICS_4 ).createAudience( {
						displayName: 'Recently active users',
						membershipDurationDays: 30,
						description:
							'Users that have been active in a recent period',
						filterClauses: {},
					} )
				).toThrow(
					'filterClauses must be an array with AudienceFilterClause objects.'
				);
			} );

			it( 'creates an audience', async () => {
				fetchMock.postOnce( createAudienceEndpoint, {
					status: 200,
					body: audiencesFixture[ 2 ],
				} );

				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					status: 200,
					body: [ audiencesFixture[ 0 ], audiencesFixture[ 1 ] ],
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createAudience( audience );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( createAudienceEndpoint, {
					body: {
						data: {
							audience,
						},
					},
				} );
			} );
		} );

		describe( 'getAvailableAudiences', () => {
			const availableAudiences = [
				{
					name: 'properties/123456789/audiences/0987654321',
					displayName: 'All visitors',
					description: 'All users',
					audienceType: 'DEFAULT_AUDIENCE',
					audienceSlug: 'all-users',
				},
			];

			it( 'should not sync cached audiences when the availableAudiences setting is not null', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				const audiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableAudiences();

				expect( fetchMock ).toHaveFetchedTimes( 0 );
				expect( audiences ).toEqual( availableAudiences );
			} );

			it( 'should sync cached audiences when the availableAudiences setting is null', async () => {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				// Simulate a scenario where getAvailableAudiences is null.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( null );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toBeNull();

				// Wait until the resolver has finished fetching the audiences.
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableAudiences();

				const audiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableAudiences();

				// Make sure that available audiences are same as the audiences fetched from the sync audiences.
				expect( audiences ).toEqual( availableAudiences );
			} );
		} );

		describe( 'syncAvailableAudiences', () => {
			const availableAudiences = [
				{
					name: 'properties/123456789/audiences/0987654321',
					displayName: 'All visitors',
					description: 'All users',
					audienceType: 'DEFAULT_AUDIENCE',
					audienceSlug: 'all-users',
				},
			];

			it( 'should make a network request to sync available audiences', () => {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncAvailableAudiences();

				expect( fetchMock ).toHaveFetched(
					syncAvailableAudiencesEndpoint
				);
			} );

			it( 'should return and dispatch an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncAvailableAudiences();

				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForAction( 'syncAvailableAudiences' )
				).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );

			it( 'should return the available audiences and update the `availableAudiences` datastore module setting value on success', async () => {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncAvailableAudiences();

				expect( response ).toEqual( availableAudiences );
				expect( error ).toBeUndefined();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toEqual( availableAudiences );
			} );
		} );

		describe( 'enableAudienceGroup', () => {
			function createAvailableUserAudience( audienceID ) {
				return {
					name: `properties/12345/audiences/${ audienceID }`,
					description: `Description ${ audienceID }`,
					displayName: `Test Audience ${ audienceID }`,
					audienceType: 'USER_AUDIENCE',
					audienceSlug: '',
				};
			}

			function createAudiencesTotalUsersMockReport(
				totalUsersByAudience
			) {
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

			const audienceSettingsEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
			);

			const testPropertyID = propertiesFixture[ 0 ]._id;

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

			beforeEach( () => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableAudiences: null,
					// Assume the required custom dimension is available for most tests. Its creation is tested in its own subsection.
					availableCustomDimensions: [ 'googlesitekit_post_type' ],
					propertyID: testPropertyID,
				} );

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
						configuredAudiences: [],
						isAudienceSegmentationWidgetHidden,
					},
					status: 200,
				} );

				const options = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiencesUserCountReportOptions(
						[ availableUserAudienceFixture ],
						{ startDate, endDate: referenceDate }
					);

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

					const options = registry
						.select( MODULES_ANALYTICS_4 )
						.getAudiencesUserCountReportOptions(
							availableUserAudiences,
							{ startDate, endDate: referenceDate }
						);

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport(
							createAudiencesTotalUsersMockReport(
								totalUsersByAudience
							),
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

					const options = registry
						.select( MODULES_ANALYTICS_4 )
						.getAudiencesUserCountReportOptions(
							availableUserAudiences,
							{ startDate, endDate: referenceDate }
						);

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetReport(
							createAudiencesTotalUsersMockReport(
								totalUsersByAudience
							),
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
						...availableUserAudiences,
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

				const options = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiencesUserCountReportOptions(
						availableUserAudiences,
						{ startDate, endDate: referenceDate }
					);

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
					createAudiencesTotalUsersMockReport( {
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

			describe( 'custom dimension handling', () => {
				const createCustomDimensionEndpoint = new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
				);
				const syncAvailableCustomDimensionsEndpoint = new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
				);

				beforeEach( () => {
					provideUserAuthentication( registry );
					provideUserCapabilities( registry );

					registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
						availableAudiences: null,
						availableCustomDimensions: null,
						propertyID: testPropertyID,
					} );
				} );

				it( "creates the `googlesitekit_post_type` custom dimension if it doesn't exist", async () => {
					fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
						body: availableAudiencesFixture,
						status: 200,
					} );

					fetchMock.postOnce( audienceSettingsEndpoint, {
						body: {
							configuredAudiences: [],
							isAudienceSegmentationWidgetHidden,
						},
						status: 200,
					} );

					fetchMock.post(
						{
							url: syncAvailableCustomDimensionsEndpoint,
							repeat: 2,
						},
						() => {
							const callCount = fetchMock.calls(
								syncAvailableCustomDimensionsEndpoint
							).length;

							return {
								body:
									callCount === 1
										? []
										: [
												CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
										  ],
								status: 200,
							};
						}
					);

					fetchMock.postOnce( createCustomDimensionEndpoint, {
						body: CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
						status: 200,
					} );

					const options = registry
						.select( MODULES_ANALYTICS_4 )
						.getAudiencesUserCountReportOptions(
							[ availableUserAudienceFixture ],
							{ startDate, endDate: referenceDate }
						);

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
						createCustomDimensionEndpoint,
						{
							body: {
								data: {
									propertyID: testPropertyID,
									customDimension:
										CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
								},
							},
						}
					);

					expect( fetchMock ).toHaveFetchedTimes(
						2,
						syncAvailableCustomDimensionsEndpoint
					);

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getAvailableCustomDimensions()
					).toEqual( [
						CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
					] );

					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isCustomDimensionGatheringData(
								'googlesitekit_post_type'
							)
					).toBe( true );
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		const defaultAudienceResourceNames = [
			'properties/12345/audiences/1', // All visitors.
			'properties/12345/audiences/2', // Purchasers.
		];

		const siteKitAudienceResourceNames = [
			'properties/12345/audiences/3', // New visitors.
			'properties/12345/audiences/4', // Returning visitors.
		];

		const userAudienceResourceNames = [
			'properties/12345/audiences/5', // Test audience.
		];

		describe( 'isDefaultAudience', () => {
			it( 'should return `true` if the audience is a default audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				defaultAudienceResourceNames.forEach(
					( audienceResourceName ) => {
						const isDefaultAudience = registry
							.select( MODULES_ANALYTICS_4 )
							.isDefaultAudience( audienceResourceName );

						expect( isDefaultAudience ).toBe( true );
					}
				);
			} );

			it( 'should return `false` if the audience is not a default audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				[
					...siteKitAudienceResourceNames,
					...userAudienceResourceNames,
				].forEach( ( audienceResourceName ) => {
					const isDefaultAudience = registry
						.select( MODULES_ANALYTICS_4 )
						.isDefaultAudience( audienceResourceName );

					expect( isDefaultAudience ).toBe( false );
				} );
			} );

			it( 'should return `undefined` if the available audiences are not loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

				const isDefaultAudience = registry
					.select( MODULES_ANALYTICS_4 )
					.isDefaultAudience( defaultAudienceResourceNames[ 0 ] );

				expect( isDefaultAudience ).toBeUndefined();
			} );
		} );

		describe( 'isSiteKitAudience', () => {
			it( 'should return `true` if the audience is a Site Kit audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				siteKitAudienceResourceNames.forEach(
					( audienceResourceName ) => {
						const isSiteKitAudience = registry
							.select( MODULES_ANALYTICS_4 )
							.isSiteKitAudience( audienceResourceName );

						expect( isSiteKitAudience ).toBe( true );
					}
				);
			} );

			it( 'should return `false` if the audience is not a Site Kit audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				[
					...defaultAudienceResourceNames,
					...userAudienceResourceNames,
				].forEach( ( audienceResourceName ) => {
					const isSiteKitAudience = registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteKitAudience( audienceResourceName );

					expect( isSiteKitAudience ).toBe( false );
				} );
			} );

			it( 'should return `undefined` if the available audiences are not loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

				const isSiteKitAudience = registry
					.select( MODULES_ANALYTICS_4 )
					.isSiteKitAudience( siteKitAudienceResourceNames[ 0 ] );

				expect( isSiteKitAudience ).toBeUndefined();
			} );
		} );

		describe( 'isUserAudience', () => {
			it( 'should return `true` if the audience is a user audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				userAudienceResourceNames.forEach( ( audienceResourceName ) => {
					const isUserAudience = registry
						.select( MODULES_ANALYTICS_4 )
						.isUserAudience( audienceResourceName );

					expect( isUserAudience ).toBe( true );
				} );
			} );

			it( 'should return `false` if the audience is not a user audience', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				[
					...defaultAudienceResourceNames,
					...siteKitAudienceResourceNames,
				].forEach( ( audienceResourceName ) => {
					const isUserAudience = registry
						.select( MODULES_ANALYTICS_4 )
						.isUserAudience( audienceResourceName );

					expect( isUserAudience ).toBe( false );
				} );
			} );

			it( 'should return `undefined` if the available audiences are not loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

				const isUserAudience = registry
					.select( MODULES_ANALYTICS_4 )
					.isUserAudience( userAudienceResourceNames[ 0 ] );

				expect( isUserAudience ).toBeUndefined();
			} );
		} );

		describe( 'hasAudiences', () => {
			const testAudience1 = {
				name: 'properties/12345/audiences/12345',
			};

			const testAudience2 = {
				name: 'properties/12345/audiences/67890',
			};

			const testAudience1ResourceName = testAudience1.name;
			const testAudience2ResourceName = testAudience2.name;

			const availableAudiences = [ testAudience1, testAudience2 ];

			it( 'returns undefined when available audiences have not loaded', async () => {
				freezeFetch( availableAudiences );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( testAudience1ResourceName )
				).toBe( undefined );

				await waitForDefaultTimeouts();
			} );

			it( 'returns false when available audiences are null or not set', async () => {
				freezeFetch( syncAvailableAudiencesEndpoint );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableAudiences: null,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( testAudience1ResourceName )
				).toBe( false );

				await waitForDefaultTimeouts();
			} );

			it( 'returns true when all provided audiences are available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableAudiences,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( testAudience1ResourceName )
				).toBe( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( [
							testAudience1ResourceName,
							testAudience2ResourceName,
						] )
				).toBe( true );
			} );

			it( 'returns false when some or all provided audiences are not available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					availableAudiences,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( 'properties/12345/audiences/54321' )
				).toBe( false );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasAudiences( [
							testAudience1ResourceName,
							'properties/12345/audiences/54321',
						] )
				).toBe( false );
			} );
		} );

		describe( 'getConfigurableAudiences', () => {
			it( 'should return `undefined` if the available audiences are not loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

				const configurableAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getConfigurableAudiences();

				expect( configurableAudiences ).toBeUndefined();
			} );

			it( 'should return empty array if loaded `availableAudiences` is not an array', async () => {
				freezeFetch( syncAvailableAudiencesEndpoint );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( { availableAudiences: null } );

				const configurableAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getConfigurableAudiences();

				expect( configurableAudiences ).toEqual( [] );

				await waitForDefaultTimeouts();
			} );

			it( 'should not include "Purchasers" if it has no data', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				// Simulate no data available state for "Purchasers".
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: availableAudiencesFixture.reduce(
							( acc, { audienceSlug, name } ) => {
								if ( 'purchasers' === audienceSlug ) {
									acc[ name ] = 0;
								} else {
									acc[ name ] = 20201220;
								}

								return acc;
							},
							{}
						),
						customDimension: {},
						property: {},
					} );

				const configurableAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getConfigurableAudiences();

				expect( configurableAudiences ).toEqual(
					availableAudiencesFixture.filter(
						( { audienceSlug } ) => 'purchasers' !== audienceSlug
					)
				);
			} );

			it( 'should include "Purchasers" if it has data', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					availableAudiences: availableAudiencesFixture,
				} );

				// Simulate data available state for all available audiences.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: availableAudiencesFixture.reduce(
							( acc, { name } ) => {
								acc[ name ] = 20201220;

								return acc;
							},
							{}
						),
						customDimension: {},
						property: {},
					} );

				const configurableAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getConfigurableAudiences();

				expect( configurableAudiences ).toEqual(
					availableAudiencesFixture
				);
			} );
		} );

		describe( 'getAudiencesUserCountReportOptions', () => {
			const expectedReportOptions = {
				metrics: [
					{
						name: 'totalUsers',
					},
				],
				dimensions: [ { name: 'audienceResourceName' } ],
				dimensionFilters: {
					audienceResourceName: availableAudiencesFixture.map(
						( { name } ) => name
					),
				},
			};

			it( 'should return report options to get user count for passed audiences', () => {
				const reportOptions = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiencesUserCountReportOptions(
						availableAudiencesFixture,
						{ startDate: '2024-02-09', endDate: '2024-05-12' }
					);

				expect( reportOptions ).toEqual( {
					...expectedReportOptions,
					startDate: '2024-02-09',
					endDate: '2024-05-12',
				} );
			} );

			it( 'should use the current date range if dates are not specified', () => {
				const reportOptions = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiencesUserCountReportOptions(
						availableAudiencesFixture
					);

				const { startDate, endDate } = registry
					.select( CORE_USER )
					.getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );

				expect( reportOptions ).toEqual( {
					...expectedReportOptions,
					startDate,
					endDate,
				} );
			} );
		} );
	} );
} );
