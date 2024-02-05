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
	untilResolved,
} from '../../../../../tests/js/utils';
import {
	AUDIENCE_FILTER_CLAUSE_TYPE_ENUM,
	AUDIENCE_FILTER_SCOPE_ENUM,
	MODULES_ANALYTICS_4,
} from './constants';
import { audiences as audiencesFixture } from './__fixtures__';

describe( 'modules/analytics-4 audiences', () => {
	let registry;

	const getAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audiences'
	);
	const createAudienceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
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

	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
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

				expect( store.getState().audiences ).toBeUndefined();

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

				expect( store.getState().audiences.length ).toBe( 1 );
				expect( store.getState().audiences[ 0 ] ).toEqual(
					audiencesFixture[ 2 ]
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAudiences', () => {
			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.get( getAudiencesEndpoint, {
					body: { audiences: audiencesFixture },
				} );

				const initialAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiences();

				expect( initialAudiences ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAudiences();

				const finalAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiences();

				expect( finalAudiences ).toEqual( audiencesFixture );
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudiences( { audiences: audiencesFixture } );

				const audiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAudiences();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAudiences();

				expect( fetchMock ).not.toHaveFetched( getAudiencesEndpoint );
				expect( audiences ).toEqual( audiencesFixture );
			} );
		} );
	} );
} );
