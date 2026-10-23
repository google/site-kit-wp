/**
 * RecentTrafficBreakdown component tests.
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
 * External dependencies
 */
import type { MockResponseObject } from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { getQueryArg, getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createBreakdownReport,
	createTitlesReport,
	forDimensions,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { plainPermalinkTopPosts } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideIncludeProductsState } from '@/js/modules/analytics-4/datastore/test-utils';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
	within,
} from '@tests/js/test-utils';
import {
	createWaitForRegistry,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import RecentTrafficBreakdown from './RecentTrafficBreakdown';

describe( 'RecentTrafficBreakdown', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const topPostsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/plain-permalink-top-posts'
	);

	const postsRequest = forDimensions( 'pagePath' );
	const titlesRequest = forDimensions( 'pagePath', 'pageTitle' );
	const channelsRequest = forDimensions( 'sessionDefaultChannelGroup' );
	const referralsRequest = forDimensions( 'sessionSource' );

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	// The site had 120 visits and 200 views, and 12 of the visits came from
	// other sites.
	const postsReport = createBreakdownReport(
		[
			[ '/ice-cream/', 82 ],
			[ '/spf/', 21 ],
			[ '/hydration/', 8 ],
		],
		200
	);

	const titlesReport = createTitlesReport( [
		[ '/ice-cream/', 'Ice cream is good for your health' ],
		[ '/spf/', 'Use SPF every day &amp; in winter' ],
		[ '/hydration/', 'Stay hydrated' ],
	] );

	const channelsReport = createBreakdownReport(
		[
			[ 'Direct', 82 ],
			[ 'Organic Search', 21 ],
			[ 'Referral', 12 ],
		],
		120
	);

	const referralsReport = createBreakdownReport(
		[
			[ 'news.example.com', 8 ],
			[ 'forum.example.com', 4 ],
		],
		12
	);

	// `ReportError` shows the message of an error whose code is `test_error`.
	const errorResponse = {
		code: 'test_error',
		message: 'Test error message',
		data: { status: 500, reason: 'internalError' },
	};

	/**
	 * Answers the four report requests of the section: the posts, their
	 * titles, the channels, and the referrals.
	 *
	 * Each request is answered with its report, such as `postsReport`, unless
	 * `responses` has another response for it. A route registered earlier
	 * answers first, so a test that needs a request to fail once, or to wait,
	 * registers that route before it calls `mockReportRequests()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [responses]           Optional. The responses that replace the reports.
	 * @param {Object} [responses.posts]     Optional. The response to the request for the posts.
	 * @param {Object} [responses.titles]    Optional. The response to the request for the post titles.
	 * @param {Object} [responses.channels]  Optional. The response to the request for the channels.
	 * @param {Object} [responses.referrals] Optional. The response to the request for the referrals.
	 * @return {void}
	 */
	function mockReportRequests(
		responses: Partial<
			Record<
				'posts' | 'titles' | 'channels' | 'referrals',
				MockResponseObject
			>
		> = {}
	) {
		fetchMock.get(
			postsRequest,
			responses.posts ?? { body: postsReport, status: 200 }
		);
		fetchMock.get(
			titlesRequest,
			responses.titles ?? { body: titlesReport, status: 200 }
		);
		fetchMock.get(
			channelsRequest,
			responses.channels ?? { body: channelsReport, status: 200 }
		);
		fetchMock.get(
			referralsRequest,
			responses.referrals ?? { body: referralsReport, status: 200 }
		);
	}

	/**
	 * Gets the `.googlesitekit-table-tile` element of the column whose heading
	 * is the given title.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} title The title of the column.
	 * @return {HTMLDivElement} The column.
	 */
	function getColumn( title: string ): HTMLDivElement {
		return screen
			.getByRole( 'heading', { name: title } )
			.closest( '.googlesitekit-table-tile' ) as HTMLDivElement;
	}

	/**
	 * Gets the text of the label and the value of each row of a column.
	 *
	 * @since n.e.x.t
	 *
	 * @param {HTMLDivElement} column The column.
	 * @return {Array<Array<string>>} The label and the value of each row.
	 */
	function getRowTexts( column: HTMLDivElement ) {
		return Array.from(
			column.querySelectorAll( '.googlesitekit-table-tile__row' )
		).map( ( row ) => [
			row.querySelector( '.googlesitekit-table-tile__cell--label' )
				?.textContent,
			row.querySelector( '.googlesitekit-table-tile__cell--value' )
				?.textContent,
		] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( 'should render the "What’s affecting recent traffic?" heading, then the posts, channels, and referrals columns', async () => {
		mockReportRequests();

		const { container, waitForRegistry } = render(
			<RecentTrafficBreakdown />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			screen.getByRole( 'region', {
				name: 'What’s affecting recent traffic?',
			} )
		).toBeInTheDocument();
		expect(
			Array.from(
				container.querySelectorAll( '.googlesitekit-table-tile__title' )
			).map( ( title ) => title.textContent )
		).toEqual( [
			'Top posts by visitors',
			'Top channels by visitors',
			'Top referrals by visitors',
		] );
	} );

	it( 'should render the titles of the columns as headings one level below the heading of the section', async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			screen
				.getAllByRole( 'heading', { level: 3 } )
				.map( ( heading ) => heading.textContent )
		).toEqual( [ 'What’s affecting recent traffic?' ] );
		expect(
			screen
				.getAllByRole( 'heading', { level: 4 } )
				.map( ( heading ) => heading.textContent )
		).toEqual( [
			'Top posts by visitors',
			'Top channels by visitors',
			'Top referrals by visitors',
		] );
	} );

	it( "should render each row's share of the total of its column's report", async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		// The posts column divides by the site's 200 views, the channels column
		// by its 120 visits, and the referrals column by the 12 visits from
		// other sites.
		expect( getRowTexts( getColumn( 'Top posts by visitors' ) ) ).toEqual( [
			[ 'Ice cream is good for your health', '82(41.0%)' ],
			[ 'Use SPF every day & in winter', '21(10.5%)' ],
			[ 'Stay hydrated', '8(4.0%)' ],
		] );
		expect(
			getRowTexts( getColumn( 'Top channels by visitors' ) )
		).toEqual( [
			[ 'Direct', '82(68.3%)' ],
			[ 'Organic Search', '21(17.5%)' ],
			[ 'Referral', '12(10.0%)' ],
		] );
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(66.7%)' ],
			[ 'forum.example.com', '4(33.3%)' ],
		] );
	} );

	it( 'should render the post titles rather than their paths, each linking to its page', async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		const postsColumn = within( getColumn( 'Top posts by visitors' ) );

		expect(
			postsColumn
				.getAllByRole( 'link' )
				.map( ( link ) => [
					link.textContent,
					link.getAttribute( 'href' ),
				] )
		).toEqual( [
			[
				'Ice cream is good for your health',
				'http://example.com/ice-cream/',
			],
			[ 'Use SPF every day & in winter', 'http://example.com/spf/' ],
			[ 'Stay hydrated', 'http://example.com/hydration/' ],
		] );
		expect(
			postsColumn.queryByText( '/ice-cream/' )
		).not.toBeInTheDocument();
	} );

	it( 'should not request a title for a page that had no views', async () => {
		// A report includes values with no views, so one of its three rows can
		// be a page with none.
		mockReportRequests( {
			posts: {
				body: createBreakdownReport( [
					[ '/ice-cream/', 82 ],
					[ '/spf/', 21 ],
					[ '/summer-hats/', 0 ],
				] ),
				status: 200,
			},
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, titlesRequest );

		const [ [ titlesURL ] ] = fetchMock.calls( titlesRequest );

		expect( getQueryArg( titlesURL, 'dimensionFilters' ) ).toEqual( {
			pagePath: [ '/ice-cream/', '/spf/' ],
		} );
	} );

	it( 'should render the path of a page that Analytics has no title for', async () => {
		mockReportRequests( {
			titles: {
				body: { rows: titlesReport.rows?.slice( 0, 2 ) },
				status: 200,
			},
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			within( getColumn( 'Top posts by visitors' ) ).getByRole( 'link', {
				name: '/hydration/ (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'http://example.com/hydration/' );
	} );

	it( 'should render a page path that resolves to another site as text, with no link', async () => {
		mockReportRequests( {
			posts: {
				body: createBreakdownReport( [
					[ '//spam.example/offer/', 90 ],
					[ '/ice-cream/', 82 ],
				] ),
				status: 200,
			},
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		const postsColumn = within( getColumn( 'Top posts by visitors' ) );

		expect(
			postsColumn.getByText( '//spam.example/offer/' ).closest( 'a' )
		).toBeNull();
		expect(
			postsColumn
				.getAllByRole( 'link' )
				.map( ( link ) => link.getAttribute( 'href' ) )
		).toEqual( [ 'http://example.com/ice-cream/' ] );
	} );

	it( 'should request the referrals for the "Referral" channel alone', async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		const [ [ referralsURL ] ] = fetchMock.calls( referralsRequest );

		expect( getQueryArg( referralsURL, 'dimensionFilters' ) ).toEqual( {
			sessionDefaultChannelGroup: 'Referral',
		} );
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(66.7%)' ],
			[ 'forum.example.com', '4(33.3%)' ],
		] );
	} );

	it( 'should render a report error in the column whose report fails, and the rows of the other two columns', async () => {
		mockReportRequests( {
			channels: { body: errorResponse, status: 500 },
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect(
			getColumn( 'Top channels by visitors' ).querySelector(
				'.googlesitekit-table-tile__error'
			)
		).toHaveTextContent( 'Test error message' );
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
		expect(
			within( getColumn( 'Top referrals by visitors' ) ).getByText(
				'news.example.com'
			)
		).toBeInTheDocument();
	} );

	it( 'should request a failed report again, and render its rows, when "Retry" is clicked in its column', async () => {
		fetchMock.getOnce( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top channels by visitors' ) ).getByRole(
				'button',
				{ name: 'Retry' }
			)
		);

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, channelsRequest );
		expect(
			within( getColumn( 'Top channels by visitors' ) ).getByText(
				'Direct'
			)
		).toBeInTheDocument();
	} );

	it( 'should keep the rows of the other two columns, with no loading state, when "Retry" is clicked in a column whose own report failed', async () => {
		fetchMock.getOnce( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );
		freezeFetch( channelsRequest );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		fireEvent.click(
			within( getColumn( 'Top channels by visitors' ) ).getByRole(
				'button',
				{ name: 'Retry' }
			)
		);

		expect(
			getColumn( 'Top posts by visitors' ).querySelector(
				'.googlesitekit-table-tile__loading'
			)
		).not.toBeInTheDocument();
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(66.7%)' ],
			[ 'forum.example.com', '4(33.3%)' ],
		] );
	} );

	it( 'should request a failed report of posts again, and render its rows, when "Retry" is clicked in the posts column', async () => {
		fetchMock.getOnce( postsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( postsRequest, {
			body: postsReport,
			status: 200,
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top posts by visitors' ) ).getByRole(
				'button',
				{ name: 'Retry' }
			)
		);

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, postsRequest );
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
	} );

	it( 'should render each page path as a link, with no error, in the posts column when the request for the post titles fails', async () => {
		mockReportRequests( {
			titles: { body: errorResponse, status: 500 },
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		const postsColumn = getColumn( 'Top posts by visitors' );

		expect(
			within( postsColumn )
				.getAllByRole( 'link' )
				.map( ( link ) => [
					link.textContent,
					link.getAttribute( 'href' ),
				] )
		).toEqual( [
			[ '/ice-cream/', 'http://example.com/ice-cream/' ],
			[ '/spf/', 'http://example.com/spf/' ],
			[ '/hydration/', 'http://example.com/hydration/' ],
		] );
		expect(
			postsColumn.querySelector( '.googlesitekit-table-tile__error' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the loading state in the posts column, rather than the page paths, while the post titles load', async () => {
		freezeFetch( titlesRequest );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		const postsColumn = getColumn( 'Top posts by visitors' );

		expect( fetchMock ).toHaveFetched( titlesRequest );
		expect(
			postsColumn.querySelector( '.googlesitekit-table-tile__loading' )
		).toBeInTheDocument();
		expect(
			within( postsColumn ).queryByText( '/ice-cream/' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the loading state in each column while its report loads', async () => {
		freezeFetch( reportEndpoint, { repeat: 3 } );

		const { container } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect(
			container.querySelectorAll( '.googlesitekit-table-tile__loading' )
		).toHaveLength( 3 );
	} );

	it( 'should render the loading state in the posts column, and should not request any posts, while the site info has no `usingPlainPermalinks`', async () => {
		// This registry reads the site info from the base data of
		// `tests/js/setup-globals.js`, which has no `usingPlainPermalinks`. So
		// `isUsingPlainPermalinks()` returns `undefined`, as it does while the
		// site info loads.
		registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		fetchMock.get( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
			status: 200,
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getColumn( 'Top posts by visitors' ).querySelector(
				'.googlesitekit-table-tile__loading'
			)
		).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( postsRequest );
		expect( fetchMock ).not.toHaveFetched( topPostsEndpoint );
	} );

	it( 'should render "No data to display: no traffic from other sites to yours" in the referrals column, and the rows of the other two columns, when no visit came from another site', async () => {
		mockReportRequests( {
			referrals: { body: {}, status: 200 },
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getColumn( 'Top referrals by visitors' ).querySelector(
				'.googlesitekit-table-tile__zero-state'
			)
		).toHaveTextContent(
			'No data to display: no traffic from other sites to yours'
		);
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
		expect(
			within( getColumn( 'Top channels by visitors' ) ).getByText(
				'Direct'
			)
		).toBeInTheDocument();
	} );

	it( 'should render "No data to display: your site hasn’t received any visitors yet" in the posts and channels columns when the site had no visits', async () => {
		mockReportRequests( {
			posts: { body: {}, status: 200 },
			channels: { body: {}, status: 200 },
			referrals: { body: {}, status: 200 },
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getColumn( 'Top posts by visitors' ).querySelector(
				'.googlesitekit-table-tile__zero-state'
			)
		).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect(
			getColumn( 'Top channels by visitors' ).querySelector(
				'.googlesitekit-table-tile__zero-state'
			)
		).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect(
			getColumn( 'Top referrals by visitors' ).querySelector(
				'.googlesitekit-table-tile__zero-state'
			)
		).toHaveTextContent(
			'No data to display: no traffic from other sites to yours'
		);
	} );

	it( 'should request the posts without the pages under the product path when the setting to include products is off', async () => {
		provideIncludeProductsState( registry, {
			setting: false,
			productPathPrefix: '/product/',
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
			features: [ 'freshData' ],
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, postsRequest );

		const [ [ postsURL ] ] = fetchMock.calls( postsRequest );

		expect( getQueryArg( postsURL, 'dimensionFilters' ) ).toEqual( {
			pagePath: {
				filterType: 'stringFilter',
				matchType: 'BEGINS_WITH',
				value: '/product/',
				notExpression: 'true',
			},
		} );
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
	} );

	it( 'should render the loading state in the posts column, and should not request the posts, while the setting to include products loads', async () => {
		// The registry from `beforeEach()` has the Analytics settings, so this
		// test builds one without them.
		registry = createTestRegistry();
		provideSiteInfo( registry, {
			wooCommerceActive: true,
			productPathPrefix: '/product/',
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		freezeFetch( settingsEndpoint );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
			features: [ 'freshData' ],
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
		expect( fetchMock ).not.toHaveFetched( postsRequest );
		expect(
			getColumn( 'Top posts by visitors' ).querySelector(
				'.googlesitekit-table-tile__loading'
			)
		).toBeInTheDocument();
		expect(
			within( getColumn( 'Top channels by visitors' ) ).getByText(
				'Direct'
			)
		).toBeInTheDocument();
	} );

	it( 'should not render the "Top posts by visitors" column, and should not request its report, when the site has no published posts', async () => {
		mockReportRequests();

		const { container, waitForRegistry } = render(
			<RecentTrafficBreakdown hasNoPublishedPosts />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			Array.from(
				container.querySelectorAll( '.googlesitekit-table-tile__title' )
			).map( ( title ) => title.textContent )
		).toEqual( [
			'Top channels by visitors',
			'Top referrals by visitors',
		] );
		expect( fetchMock ).not.toHaveFetched( postsRequest );
		expect(
			within( getColumn( 'Top channels by visitors' ) ).getByText(
				'Direct'
			)
		).toBeInTheDocument();
	} );

	describe( 'on plain permalinks', () => {
		beforeEach( () => {
			provideSiteInfo( registry, { usingPlainPermalinks: true } );
		} );

		it( 'should render the title of each post, each linking to its post, with its share of the views of the report', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			const postsColumn = getColumn( 'Top posts by visitors' );

			expect( getRowTexts( postsColumn ) ).toEqual( [
				[ 'Travel tips', '30(30.0%)' ],
				[ 'About', '20(20.0%)' ],
				[ '/?p=3', '10(10.0%)' ],
			] );
			expect(
				within( postsColumn )
					.getAllByRole( 'link' )
					.map( ( link ) => link.getAttribute( 'href' ) )
			).toEqual( [
				'http://example.com/?p=1',
				'http://example.com/?page_id=2',
				'http://example.com/?p=3',
			] );
		} );

		it( 'should not request the report of views by `pagePath` or the report of page titles', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( fetchMock ).not.toHaveFetched( postsRequest );
			expect( fetchMock ).not.toHaveFetched( titlesRequest );
		} );

		it( 'should render a report error in the posts column, and the rows of the other two columns, when the request for the posts fails', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: errorResponse,
				status: 500,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();
			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__error'
				)
			).toHaveTextContent( 'Test error message' );
			expect(
				getRowTexts( getColumn( 'Top channels by visitors' ) )
			).toEqual( [
				[ 'Direct', '82(68.3%)' ],
				[ 'Organic Search', '21(17.5%)' ],
				[ 'Referral', '12(10.0%)' ],
			] );
			expect(
				getRowTexts( getColumn( 'Top referrals by visitors' ) )
			).toEqual( [
				[ 'news.example.com', '8(66.7%)' ],
				[ 'forum.example.com', '4(33.3%)' ],
			] );
		} );

		it( 'should request the posts again, and render their rows, when "Retry" is clicked in the posts column', async () => {
			fetchMock.getOnce( topPostsEndpoint, {
				body: errorResponse,
				status: 500,
			} );
			fetchMock.getOnce( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();

			const waitForRetry = createWaitForRegistry( registry );

			fireEvent.click(
				within( getColumn( 'Top posts by visitors' ) ).getByRole(
					'button',
					{ name: 'Retry' }
				)
			);

			await waitForRetry();

			expect( fetchMock ).toHaveFetchedTimes( 2, topPostsEndpoint );
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Travel tips', '30(30.0%)' ],
				[ 'About', '20(20.0%)' ],
				[ '/?p=3', '10(10.0%)' ],
			] );
		} );

		it( 'should render the loading state in the posts column, and the rows of the other two columns, while the posts load', async () => {
			freezeFetch( topPostsEndpoint );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__loading'
				)
			).toBeInTheDocument();
			expect(
				getRowTexts( getColumn( 'Top channels by visitors' ) )
			).toEqual( [
				[ 'Direct', '82(68.3%)' ],
				[ 'Organic Search', '21(17.5%)' ],
				[ 'Referral', '12(10.0%)' ],
			] );
			expect(
				getRowTexts( getColumn( 'Top referrals by visitors' ) )
			).toEqual( [
				[ 'news.example.com', '8(66.7%)' ],
				[ 'forum.example.com', '4(33.3%)' ],
			] );
		} );

		it( 'should render "No data to display: your posts haven’t received any visitors yet" in the posts column when the report had views but none on a single post', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: { rows: [], total: 75 },
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__zero-state'
				)
			).toHaveTextContent(
				'No data to display: your posts haven’t received any visitors yet'
			);
		} );

		it( 'should render "No data to display: your site hasn’t received any visitors yet" in the posts column when the report had no views', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: { rows: [], total: 0 },
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__zero-state'
				)
			).toHaveTextContent(
				'No data to display: your site hasn’t received any visitors yet'
			);
		} );

		it( 'should render the title of each column as a level 4 heading', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				screen
					.getAllByRole( 'heading', { level: 4 } )
					.map( ( heading ) => heading.textContent )
			).toEqual( [
				'Top posts by visitors',
				'Top channels by visitors',
				'Top referrals by visitors',
			] );
		} );

		it( 'should render the title of each post for a view-only user, from one request for the three posts of the Recent activity date range', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, topPostsEndpoint );
			expect(
				getQueryArgs(
					fetchMock.lastCall( topPostsEndpoint )?.[ 0 ] ?? ''
				)
			).toMatchObject( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
				limit: '3',
			} );
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Travel tips', '30(30.0%)' ],
				[ 'About', '20(20.0%)' ],
				[ '/?p=3', '10(10.0%)' ],
			] );
		} );

		it( 'should not render the "Top posts by visitors" column, and should not request its posts, when the site has no published posts', async () => {
			fetchMock.get( topPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );
			mockReportRequests();

			const { waitForRegistry } = render(
				<RecentTrafficBreakdown hasNoPublishedPosts />,
				{ registry }
			);

			await waitForRegistry();

			expect(
				screen
					.getAllByRole( 'heading', { level: 4 } )
					.map( ( heading ) => heading.textContent )
			).toEqual( [
				'Top channels by visitors',
				'Top referrals by visitors',
			] );
			expect( fetchMock ).not.toHaveFetched( topPostsEndpoint );
		} );
	} );
} );
