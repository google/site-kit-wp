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
import { getQueryArg } from '@wordpress/url';

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
		const plainPostsRequest = forDimensions( 'pagePathPlusQueryString' );

		const postsByPagePathEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/posts-by-page-path'
		);

		// The site had 92 views, and post `1` had 45 of them, through two URLs.
		const plainPostsReport = createBreakdownReport(
			[
				[ '/?p=1', 30 ],
				[ '/', 20 ],
				[ '/?p=1&utm_source=newsletter', 15 ],
				[ '/?product=hoodie', 12 ],
				[ '/?page_id=2', 10 ],
				[ '/?s=hats', 5 ],
			],
			92
		);

		const postsByPagePath = {
			'/?p=1': {
				id: 1,
				postType: 'post',
				title: 'Hello world!',
				url: 'http://example.com/?p=1',
			},
			'/': null,
			'/?product=hoodie': {
				id: 5,
				postType: 'product',
				title: 'Hoodie',
				url: 'http://example.com/?product=hoodie',
			},
			'/?page_id=2': {
				id: 2,
				postType: 'page',
				title: 'About',
				url: 'http://example.com/?page_id=2',
			},
			'/?s=hats': null,
		};

		/**
		 * Answers the requests of the section on plain permalinks: the report
		 * of the URLs, the posts of their page paths, the channels, and the
		 * referrals.
		 *
		 * A route registered earlier answers first, so a test that needs a
		 * request to fail once, or to wait, registers that route before it
		 * calls `mockPlainPermalinkRequests()`.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [responses]                 Optional. The responses that replace the default ones.
		 * @param {Object} [responses.posts]           Optional. The response to the request for the report of the URLs.
		 * @param {Object} [responses.postsByPagePath] Optional. The response to the request for the posts of the page paths.
		 * @return {void}
		 */
		function mockPlainPermalinkRequests(
			responses: Partial<
				Record< 'posts' | 'postsByPagePath', MockResponseObject >
			> = {}
		) {
			fetchMock.get(
				plainPostsRequest,
				responses.posts ?? { body: plainPostsReport, status: 200 }
			);
			fetchMock.get(
				postsByPagePathEndpoint,
				responses.postsByPagePath ?? {
					body: postsByPagePath,
					status: 200,
				}
			);
			fetchMock.get( channelsRequest, {
				body: channelsReport,
				status: 200,
			} );
			fetchMock.get( referralsRequest, {
				body: referralsReport,
				status: 200,
			} );
		}

		beforeEach( () => {
			provideSiteInfo( registry, { usingPlainPermalinks: true } );
		} );

		it( "should render one row for each post, with its title and its share of the site's views, most views first", async () => {
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Hello world!', '45(48.9%)' ],
				[ 'Hoodie', '12(13.0%)' ],
				[ 'About', '10(10.9%)' ],
			] );
		} );

		it( 'should link each row to the permalink of its post', async () => {
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				within( getColumn( 'Top posts by visitors' ) )
					.getAllByRole( 'link' )
					.map( ( link ) => [
						link.textContent,
						link.getAttribute( 'href' ),
					] )
			).toEqual( [
				[ 'Hello world!', 'http://example.com/?p=1' ],
				[ 'Hoodie', 'http://example.com/?product=hoodie' ],
				[ 'About', 'http://example.com/?page_id=2' ],
			] );
		} );

		it( 'should request the posts of the page paths that WordPress reads from the URLs, most views first', async () => {
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			const [ [ postsByPagePathURL ] ] = fetchMock.calls(
				postsByPagePathEndpoint
			);

			expect( getQueryArg( postsByPagePathURL, 'pagePaths' ) ).toEqual( [
				'/?p=1',
				'/',
				'/?product=hoodie',
				'/?page_id=2',
				'/?s=hats',
			] );
		} );

		it( 'should request the posts of the 50 page paths with the most views', async () => {
			mockPlainPermalinkRequests( {
				posts: {
					body: createBreakdownReport(
						Array.from(
							{ length: 51 },
							( _, index ): [ string, number ] => [
								`/?p=${ index + 1 }`,
								100 - index,
							]
						),
						3825
					),
					status: 200,
				},
				postsByPagePath: { body: {}, status: 200 },
			} );

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			const [ [ postsByPagePathURL ] ] = fetchMock.calls(
				postsByPagePathEndpoint
			);
			const pagePaths = getQueryArg( postsByPagePathURL, 'pagePaths' );

			expect( pagePaths ).toHaveLength( 50 );
			expect( pagePaths ).toContain( '/?p=50' );
			expect( pagePaths ).not.toContain( '/?p=51' );
		} );

		it( 'should leave out a URL at a path other than the home path, and request no post for it', async () => {
			mockPlainPermalinkRequests( {
				posts: {
					body: createBreakdownReport(
						[
							[ '/shop/?p=3', 50 ],
							[ '/?p=1', 30 ],
						],
						80
					),
					status: 200,
				},
			} );

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			const [ [ postsByPagePathURL ] ] = fetchMock.calls(
				postsByPagePathEndpoint
			);

			expect( getQueryArg( postsByPagePathURL, 'pagePaths' ) ).toEqual( [
				'/?p=1',
			] );
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [ [ 'Hello world!', '30(37.5%)' ] ] );
		} );

		it( 'should label a post with no title with the path and query string of its permalink', async () => {
			mockPlainPermalinkRequests( {
				postsByPagePath: {
					body: {
						'/?p=1': {
							id: 1,
							postType: 'post',
							title: '',
							url: 'http://example.com/?p=1',
						},
						'/': null,
						'/?product=hoodie': null,
						'/?page_id=2': null,
						'/?s=hats': null,
					},
					status: 200,
				},
			} );

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				within( getColumn( 'Top posts by visitors' ) )
					.getAllByRole( 'link' )
					.map( ( link ) => [
						link.textContent,
						link.getAttribute( 'href' ),
					] )
			).toEqual( [ [ '/?p=1', 'http://example.com/?p=1' ] ] );
		} );

		it( 'should render the products like any other post when the setting to include products is on', async () => {
			provideIncludeProductsState( registry, {
				setting: true,
				usingPlainPermalinks: true,
			} );
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
				features: [ 'freshData' ],
			} );

			await waitForRegistry();

			const [ [ postsURL ] ] = fetchMock.calls( plainPostsRequest );

			expect(
				getQueryArg( postsURL, 'dimensionFilters' )
			).toBeUndefined();
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Hello world!', '45(48.9%)' ],
				[ 'Hoodie', '12(13.0%)' ],
				[ 'About', '10(10.9%)' ],
			] );
		} );

		it( 'should request the report without the product URLs, and leave out the products, when the setting to include products is off', async () => {
			provideIncludeProductsState( registry, {
				setting: false,
				usingPlainPermalinks: true,
			} );
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
				features: [ 'freshData' ],
			} );

			await waitForRegistry();

			const [ [ postsURL ] ] = fetchMock.calls( plainPostsRequest );

			expect( getQueryArg( postsURL, 'dimensionFilters' ) ).toEqual( {
				pagePathPlusQueryString: {
					filterType: 'stringFilter',
					matchType: 'PARTIAL_REGEXP',
					value: '[?&](product=[^&]|post_type=product(&|$))',
					notExpression: 'true',
				},
			} );
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Hello world!', '45(48.9%)' ],
				[ 'About', '10(10.9%)' ],
			] );
		} );

		it( 'should render the loading state, rather than the URLs, while the posts of the URLs load', async () => {
			freezeFetch( postsByPagePathEndpoint );
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			const postsColumn = getColumn( 'Top posts by visitors' );

			expect( fetchMock ).toHaveFetched( postsByPagePathEndpoint );
			expect(
				postsColumn.querySelector(
					'.googlesitekit-table-tile__loading'
				)
			).toBeInTheDocument();
			expect(
				within( postsColumn ).queryByText( '/?p=1' )
			).not.toBeInTheDocument();
		} );

		it( 'should render the page path that WordPress reads from the URLs of each row, linked to it, with no error, when the request for the posts fails', async () => {
			mockPlainPermalinkRequests( {
				postsByPagePath: { body: errorResponse, status: 500 },
			} );

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();

			const postsColumn = getColumn( 'Top posts by visitors' );

			expect( getRowTexts( postsColumn ) ).toEqual( [
				[ '/?p=1', '45(48.9%)' ],
				[ '/', '20(21.7%)' ],
				[ '/?product=hoodie', '12(13.1%)' ],
			] );
			expect(
				within( postsColumn )
					.getAllByRole( 'link' )
					.map( ( link ) => link.getAttribute( 'href' ) )
			).toEqual( [
				'http://example.com/?p=1',
				'http://example.com/',
				'http://example.com/?product=hoodie',
			] );
			expect(
				postsColumn.querySelector( '.googlesitekit-table-tile__error' )
			).not.toBeInTheDocument();
		} );

		it( 'should request the report again, and render the rows, when "Retry" is clicked after the report of the URLs fails', async () => {
			fetchMock.getOnce( plainPostsRequest, {
				body: errorResponse,
				status: 500,
			} );
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();
			expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
			expect(
				within( getColumn( 'Top channels by visitors' ) ).getByText(
					'Direct'
				)
			).toBeInTheDocument();
			expect(
				within( getColumn( 'Top referrals by visitors' ) ).getByText(
					'news.example.com'
				)
			).toBeInTheDocument();

			const waitForRetry = createWaitForRegistry( registry );

			fireEvent.click(
				within( getColumn( 'Top posts by visitors' ) ).getByRole(
					'button',
					{ name: 'Retry' }
				)
			);

			await waitForRetry();

			expect( fetchMock ).toHaveFetchedTimes( 2, plainPostsRequest );
			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Hello world!', '45(48.9%)' ],
				[ 'Hoodie', '12(13.0%)' ],
				[ 'About', '10(10.9%)' ],
			] );
		} );

		it( 'should render "No data to display: your posts haven’t received any visitors yet" when the site had views but no post had any', async () => {
			mockPlainPermalinkRequests( {
				posts: {
					body: createBreakdownReport(
						[
							[ '/', 20 ],
							[ '/?s=hats', 5 ],
						],
						25
					),
					status: 200,
				},
				postsByPagePath: {
					body: { '/': null, '/?s=hats': null },
					status: 200,
				},
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
				'No data to display: your posts haven’t received any visitors yet'
			);
		} );

		it( 'should render "No data to display: your site hasn’t received any visitors yet" when the site had no views', async () => {
			mockPlainPermalinkRequests( {
				posts: { body: {}, status: 200 },
			} );

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
			} );

			await waitForRegistry();

			expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__zero-state'
				)
			).toHaveTextContent(
				'No data to display: your site hasn’t received any visitors yet'
			);
		} );

		it( 'should render the same rows, with no error, for a view-only user', async () => {
			mockPlainPermalinkRequests();

			const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			await waitForRegistry();

			expect(
				getRowTexts( getColumn( 'Top posts by visitors' ) )
			).toEqual( [
				[ 'Hello world!', '45(48.9%)' ],
				[ 'Hoodie', '12(13.0%)' ],
				[ 'About', '10(10.9%)' ],
			] );
			expect(
				getColumn( 'Top posts by visitors' ).querySelector(
					'.googlesitekit-table-tile__error'
				)
			).not.toBeInTheDocument();
		} );
	} );
} );
