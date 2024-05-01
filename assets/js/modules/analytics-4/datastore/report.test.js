/**
 * `modules/analytics-4` data store: report tests.
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
import API from 'googlesitekit-api';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
	freezeFetch,
	subscribeUntil,
	muteFetch,
	waitForTimeouts,
} from '../../../../../tests/js/utils';
import { DAY_IN_SECONDS } from '../../../util';
import { isZeroReport } from '../utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 report', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		const zeroDataReport = { totals: [ {} ] };
		const analytics4ReportRegexp = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/report'
		);
		const dataAvailableRegexp = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/data-available'
		);

		describe( 'getReport', () => {
			const options = {
				startDate: '2022-11-02',
				endDate: '2022-11-04',
				compareStartDate: '2022-11-01',
				compareEndDate: '2022-11-02',
				dimensions: [
					// Provide dimensions in both string and array formats.
					'sessionDefaultChannelGrouping',
					{
						name: 'pageTitle',
					},
				],
				metrics: [
					'sessions',
					{
						name: 'PageViews',
					},
					{
						name: 'total',
						expression: 'totalUsers',
					},
				],
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( analytics4ReportRegexp, {
					body: fixtures.report,
					status: 200,
				} );

				const initialReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( fixtures.report, { options } );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( analytics4ReportRegexp, {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_ANALYTICS_4 ).getReport( options );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPageTitles', () => {
			it( 'generates a map using a getReport call.', async () => {
				const startDate = '2021-01-01';
				const endDate = '2021-01-31';
				const pagePaths = [ '/', '/one/', '/two/' ];

				const pageTitlesArgs = {
					startDate,
					endDate,
					dimensions: [ 'pagePath', 'pageTitle' ],
					dimensionFilters: {
						pagePath: pagePaths,
					},
					metrics: [
						{
							name: 'screenPageViews',
						},
					],
					orderby: [
						{
							metric: { metricName: 'screenPageViews' },
							desc: true,
						},
					],
					limit: 15,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( fixtures.pageTitles, {
						options: pageTitlesArgs,
					} );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( pageTitlesArgs );

				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					pageTitlesArgs
				);

				registry
					.select( MODULES_ANALYTICS_4 )
					.getPageTitles( report, { startDate, endDate } );

				const titles = registry
					.select( MODULES_ANALYTICS_4 )
					.getPageTitles( report, { startDate, endDate } );

				expect( titles ).toStrictEqual( {
					'/': 'HOME',
					'/one/': 'ONE',
					'/two/': 'TWO',
				} );
			} );
		} );

		describe( 'isGatheringData', () => {
			it( 'should return `undefined` if getReport is not resolved yet', async () => {
				freezeFetch( analytics4ReportRegexp );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( fetchMock ).toHaveFetched( analytics4ReportRegexp );
			} );

			it( 'should return FALSE if the returned report has data', async () => {
				fetchMock.getOnce( analytics4ReportRegexp, {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( analytics4ReportRegexp, {
					body: response,
					status: 500,
				} );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( isGatheringData() ).toBe( true );
				expect( console ).toHaveErrored();
				expect( fetchMock ).not.toHaveFetched( dataAvailableRegexp );
			} );

			it( 'should return TRUE if propertyCreateTime is 0', async () => {
				registry.dispatch( CORE_USER ).receiveGetAuthentication( {
					authenticated: true,
				} );

				fetchMock.getOnce( analytics4ReportRegexp, {
					body: zeroDataReport,
				} );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					propertyCreateTime: 0,
				} );

				muteFetch( dataAvailableRegexp );

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			describe.each( [
				[ 'undefined', undefined ],
				[ 'null', null ],
				[ 'empty', {} ],
				[ 'a zero data report', zeroDataReport ],
				[
					'a report with rows but zero data',
					{
						...fixtures.report,
						totals: [ { metricValues: [ { value: '0' } ] } ],
					},
				],
			] )( 'when the returned report is %s', ( _, body ) => {
				beforeEach( () => {
					fetchMock.getOnce( analytics4ReportRegexp, {
						body,
					} );
				} );

				it( 'should return undefined if getSettings is not resolved yet', async () => {
					registry.dispatch( CORE_USER ).receiveGetAuthentication( {
						authenticated: true,
					} );

					freezeFetch(
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/settings'
						)
					);

					const { isGatheringData, hasZeroData } =
						registry.select( MODULES_ANALYTICS_4 );

					// The first call to isGatheringData returns undefined because the call to hasZeroData returns undefined.
					expect( isGatheringData() ).toBeUndefined();
					expect( hasZeroData() ).toBeUndefined();

					// Wait for resolvers to run.
					await waitForTimeouts( 30 );

					// Verify that isGatheringData still returns undefined due to getSettings not being resolved yet, while hasZeroData now returns true.
					expect( isGatheringData() ).toBeUndefined();
					expect( hasZeroData() ).toBe( true );

					await waitForTimeouts( 30 );
				} );

				it( 'should return TRUE if the connnected GA4 property is under three days old', async () => {
					registry.dispatch( CORE_USER ).receiveGetAuthentication( {
						authenticated: true,
					} );

					// Create a timestamp that is two and a half days ago.
					const createTime = new Date(
						Date.now() - DAY_IN_SECONDS * 2.5 * 1000
					).toISOString();

					const property = {
						...fixtures.properties[ 0 ],
						createTime,
					};
					const propertyID = property._id;

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetSettings( {} );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetProperty( property, { propertyID } );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );

					const { isGatheringData } =
						registry.select( MODULES_ANALYTICS_4 );

					expect( isGatheringData() ).toBeUndefined();

					await subscribeUntil(
						registry,
						() => isGatheringData() !== undefined
					);

					expect( isGatheringData() ).toBe( true );
				} );

				it( 'should return FALSE if the connected GA4 property is older than three days', async () => {
					registry.dispatch( CORE_USER ).receiveGetAuthentication( {
						authenticated: true,
					} );

					muteFetch( dataAvailableRegexp );

					// Create a timestamp that is three days ago.
					const createTime = new Date(
						Date.now() - DAY_IN_SECONDS * 3 * 1000
					).toISOString();

					const property = {
						...fixtures.properties[ 0 ],
						createTime,
					};
					const propertyID = property._id;

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetSettings( {} );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetProperty( property, { propertyID } );

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );

					const { isGatheringData } =
						registry.select( MODULES_ANALYTICS_4 );

					expect( isGatheringData() ).toBeUndefined();

					await subscribeUntil(
						registry,
						() => isGatheringData() !== undefined
					);

					expect( isGatheringData() ).toBe( false );
				} );

				it( 'should return TRUE without checking for property settings if the report has zero data and user is not authenticated', async () => {
					registry.dispatch( CORE_USER ).receiveGetAuthentication( {
						authenticated: false,
					} );

					const { isGatheringData, hasZeroData } =
						registry.select( MODULES_ANALYTICS_4 );

					// The first call to isGatheringData returns undefined because the call to hasZeroData returns undefined.
					expect( isGatheringData() ).toBeUndefined();
					expect( hasZeroData() ).toBeUndefined();

					// Wait for resolvers to run.
					await waitForTimeouts( 30 );

					// Verify that isGatheringData now returns TRUE if hasZeroData now returns true but the user is not authenticated.
					expect( isGatheringData() ).toBe( true );
					expect( hasZeroData() ).toBe( true );

					await waitForTimeouts( 30 );
				} );

				it( 'should return undefined if getAuthentication is not resolved yet', async () => {
					fetchMock.getOnce(
						new RegExp(
							'^/google-site-kit/v1/core/user/data/authentication'
						),
						{
							authenticated: false,
						}
					);

					const { isGatheringData, hasZeroData } =
						registry.select( MODULES_ANALYTICS_4 );

					// The first call to isGatheringData returns undefined because the call to hasZeroData returns undefined.
					expect( isGatheringData() ).toBeUndefined();
					expect( hasZeroData() ).toBeUndefined();

					// Wait for the next tick to allow getReport to resolve. We don't use waitForDefaultTimeouts as the longer timeout in that function
					// can allow the getAuthenticated call to resolve too, which we don't want here.
					await new Promise( ( resolve ) => {
						setTimeout( resolve, 1 );
					} );

					// The second call to isGatheringData returns undefined because the call to isAuthenticated returns undefined.
					expect( isGatheringData() ).toBeUndefined();
					// This confirms that hasZeroData is now resolved.
					expect( hasZeroData() ).toBe( true );

					await untilResolved(
						registry,
						CORE_USER
					).getAuthentication();

					// Verify that isGatheringData now returns TRUE as the call to getAuthentication has resolved and user is not authenticated.
					expect( isGatheringData() ).toBe( true );
					expect( hasZeroData() ).toBe( true );
				} );
			} );
		} );

		describe( 'hasZeroData', () => {
			it( 'should return `undefined` if getReport has not resolved yet', async () => {
				freezeFetch( analytics4ReportRegexp );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( analytics4ReportRegexp, {
					body: response,
					status: 500,
				} );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( hasZeroData() ).toBe( true );
				expect( console ).toHaveErrored();
			} );

			it( 'should return TRUE if isZeroReport is true', async () => {
				fetchMock.getOnce( analytics4ReportRegexp, {
					body: zeroDataReport,
				} );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return FALSE if isZeroReport returns FALSE', async () => {
				expect( isZeroReport( fixtures.report ) ).toBe( false );
				fetchMock.getOnce( analytics4ReportRegexp, {
					body: fixtures.report,
				} );

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( false );
			} );
		} );

		describe( 'getReportForAllAudiences', () => {
			const getAudiencesEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/audiences'
			);

			const audiences = fixtures.audiences.map( ( { name } ) => name );

			it( 'should trigger a separate report for each provided audience', async () => {
				const options = {
					startDate: '2022-11-02',
					endDate: '2022-11-04',
					compareStartDate: '2022-11-01',
					compareEndDate: '2022-11-02',
					dimensions: [
						{
							name: 'pageTitle',
						},
					],
					metrics: [
						{
							name: 'PageViews',
						},
						{
							name: 'total',
							expression: 'totalUsers',
						},
					],
				};

				fetchMock.get( analytics4ReportRegexp, {
					body: fixtures.report,
					status: 200,
				} );

				fetchMock.getOnce( getAudiencesEndpoint, {
					body: fixtures.audiences,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getReportForAllAudiences( options, audiences );

				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					{
						...options,
						dimensionFilters: {
							audienceResourceName:
								fixtures.audiences[
									fixtures.audiences.length - 1
								].name,
						},
					}
				);

				const reports = registry
					.select( MODULES_ANALYTICS_4 )
					.getReportForAllAudiences( options, audiences );

				expect( reports ).toEqual(
					Array( fixtures.audiences.length ).fill( fixtures.report )
				);

				expect( fetchMock ).toHaveFetchedTimes( 5 );
			} );
		} );
	} );
} );
