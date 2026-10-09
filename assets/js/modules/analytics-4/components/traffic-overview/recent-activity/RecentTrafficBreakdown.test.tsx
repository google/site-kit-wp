/**
 * Recent activity traffic breakdown tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getRecentTopChannelsReportArgs,
	getRecentTopPostsReportArgs,
	getRecentTopReferralsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import RecentTrafficBreakdown from './RecentTrafficBreakdown';

describe( 'RecentTrafficBreakdown', () => {
	let registry: WPDataRegistry;

	// The Recent activity tab covers the reference date and the two days
	// before it.
	const dateRange = { startDate: '2025-02-03', endDate: '2025-02-05' };

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	it( 'should render the "What’s affecting recent traffic?" heading, then the "Top posts by visitors", "Top channels by visitors" and "Top referrals by visitors" columns, from the reports of the Recent activity date range', async () => {
		[
			getRecentTopPostsReportArgs( dateRange ),
			getRecentTopChannelsReportArgs( dateRange ),
			getRecentTopReferralsReportArgs( dateRange ),
		].forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } )
		);

		const { getAllByRole, getByRole, waitForRegistry } = render(
			<RecentTrafficBreakdown />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'What’s affecting recent traffic?',
			'Top posts by visitors',
			'Top channels by visitors',
			'Top referrals by visitors',
		] );
		expect(
			getByRole( 'region', { name: 'What’s affecting recent traffic?' } )
		).toBeInTheDocument();
		// The store already has the three reports, so a report with any other
		// date range would reach `fetchMock`.
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should not render the "Top posts by visitors" column, or request its report, when the site has no published posts', async () => {
		[
			getRecentTopChannelsReportArgs( dateRange ),
			getRecentTopReferralsReportArgs( dateRange ),
		].forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } )
		);

		const { getAllByRole, waitForRegistry } = render(
			<RecentTrafficBreakdown hasNoPublishedPosts />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'What’s affecting recent traffic?',
			'Top channels by visitors',
			'Top referrals by visitors',
		] );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should render the error in the column whose report fails, and the rows of the other two columns', async () => {
		const topPostsReportArgs = getRecentTopPostsReportArgs( dateRange );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ '/ice-cream/', 82 ] ] ),
				{ options: topPostsReportArgs }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: '/ice-cream/' },
							{ value: 'Ice cream is good for your health' },
						],
					},
				],
			},
			{
				options: getPageTitlesReportOptions( topPostsReportArgs, [
					'/ice-cream/',
				] ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ 'substack.com', 21 ] ] ),
				{ options: getRecentTopReferralsReportArgs( dateRange ) }
			);
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { findByText, getAllByText, getByText } = render(
			<RecentTrafficBreakdown />,
			{ registry }
		);

		expect(
			await findByText( 'Data error in Analytics' )
		).toBeInTheDocument();
		expect( console ).toHaveErrored();

		expect( getAllByText( 'Data error in Analytics' ) ).toHaveLength( 1 );
		expect(
			getByText( 'Ice cream is good for your health' )
		).toBeInTheDocument();
		expect( getByText( 'substack.com' ) ).toBeInTheDocument();
	} );

	it( 'should request the failed report again, and render its rows, when the user clicks "Retry"', async () => {
		[
			getRecentTopPostsReportArgs( dateRange ),
			getRecentTopReferralsReportArgs( dateRange ),
		].forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } )
		);
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { findByRole, findByText } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		fetchMock.getOnce( reportEndpoint, {
			body: createBreakdownReport( [ [ 'Direct', 82 ] ] ),
			status: 200,
		} );

		fireEvent.click( await findByRole( 'button', { name: 'Retry' } ) );

		expect( await findByText( 'Direct' ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();
		expect( fetchMock ).toHaveFetchedTimes( 2, reportEndpoint );
	} );
} );
