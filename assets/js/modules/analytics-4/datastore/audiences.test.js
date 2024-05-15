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
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import {
	AUDIENCE_FILTER_CLAUSE_TYPE_ENUM,
	AUDIENCE_FILTER_SCOPE_ENUM,
	MODULES_ANALYTICS_4,
} from './constants';
import {
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
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

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
	} );
} );
