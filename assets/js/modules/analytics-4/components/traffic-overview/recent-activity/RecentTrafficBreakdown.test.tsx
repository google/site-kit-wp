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
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createBreakdownReport,
	createSiteVisitorsReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
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

interface MockReportResponse {
	/** The body of the response. */
	body: object;
	/** The HTTP status of the response. */
	status: number;
}

describe( 'RecentTrafficBreakdown', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Gets the dimensions a report request asks for, in order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} url The URL of the request.
	 * @return {Array<string>} The dimension names.
	 */
	function getRequestedDimensions( url: string ): string[] {
		return Array.from(
			new URL( url, 'http://example.com' ).searchParams.entries()
		)
			.filter( ( [ key ] ) => key.startsWith( 'dimensions[' ) )
			.map( ( [ , value ] ) => value );
	}

	/**
	 * Gets a matcher for the report requests that ask for exactly the given
	 * dimensions.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array<string>} dimensions The dimension names, in order.
	 * @return {Function} The matcher, for `fetchMock`.
	 */
	function forDimensions( ...dimensions: string[] ) {
		return ( url: string ) =>
			reportEndpoint.test( url ) &&
			isEqual( getRequestedDimensions( url ), dimensions );
	}

	const postsRequest = forDimensions( 'pagePath' );
	const titlesRequest = forDimensions( 'pagePath', 'pageTitle' );
	const channelsRequest = forDimensions( 'sessionDefaultChannelGroup' );
	const referralsRequest = forDimensions( 'sessionSource' );
	const siteVisitorsRequest = forDimensions();

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	// The site had 120 visitors, and 12 of them came from other sites.
	const postsReport: Report = {
		dimensionHeaders: [ { name: 'pagePath' } ],
		...createBreakdownReport( [
			[ '/ice-cream/', 82 ],
			[ '/spf/', 21 ],
			[ '/hydration/', 8 ],
		] ),
	};

	const titlesReport: Report = {
		rows: [
			[ '/ice-cream/', 'Ice cream is good for your health' ],
			[ '/spf/', 'Use SPF every day &amp; in winter' ],
			[ '/hydration/', 'Stay hydrated' ],
		].map( ( [ pagePath, pageTitle ] ) => ( {
			dimensionValues: [ { value: pagePath }, { value: pageTitle } ],
		} ) ),
	};

	const channelsReport = createBreakdownReport( [
		[ 'Direct', 82 ],
		[ 'Organic Search', 21 ],
		[ 'Referral', 12 ],
	] );

	const referralsReport = createBreakdownReport( [
		[ 'news.example.com', 8 ],
		[ 'forum.example.com', 4 ],
	] );

	const siteVisitorsReport = createSiteVisitorsReport( 120 );

	// `ReportError` shows the message of an error whose code is `test_error`.
	const errorResponse = {
		code: 'test_error',
		message: 'Test error message',
		data: { status: 500, reason: 'internalError' },
	};

	/**
	 * Answers the five report requests of the section: the posts, their
	 * titles, the channels, the referrals, and the site's visitors.
	 *
	 * Each request is answered with its report, such as `postsReport`, unless
	 * `responses` has another response for it. A route registered earlier
	 * answers first, so a test that needs a request to fail once, or to wait,
	 * registers that route before it calls `mockReportRequests()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [responses]              Optional. The responses that replace the reports.
	 * @param {Object} [responses.posts]        Optional. The response to the request for the posts.
	 * @param {Object} [responses.titles]       Optional. The response to the request for the post titles.
	 * @param {Object} [responses.channels]     Optional. The response to the request for the channels.
	 * @param {Object} [responses.referrals]    Optional. The response to the request for the referrals.
	 * @param {Object} [responses.siteVisitors] Optional. The response to the request for the site's visitors.
	 * @return {void}
	 */
	function mockReportRequests(
		responses: Partial<
			Record<
				'posts' | 'titles' | 'channels' | 'referrals' | 'siteVisitors',
				MockReportResponse
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
		fetchMock.get(
			siteVisitorsRequest,
			responses.siteVisitors ?? {
				body: siteVisitorsReport,
				status: 200,
			}
		);
	}

	/**
	 * Gets the page path filter of the request for the posts, as its query
	 * arguments.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Each `dimensionFilters[pagePath]` query argument, by its name.
	 */
	function getPostsRequestPagePathFilter() {
		const [ [ postsURL ] ] = fetchMock.calls( postsRequest );

		return Object.fromEntries(
			Array.from(
				new URL( postsURL, 'http://example.com' ).searchParams.entries()
			).filter( ( [ key ] ) =>
				key.startsWith( 'dimensionFilters[pagePath]' )
			)
		);
	}

	/**
	 * Puts in the store a connected Analytics module, an active WooCommerce
	 * with its product path, and the setting to include products.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  setting                  The setting.
	 * @param {boolean} setting.includesProducts If true, the setting to include products is on. If false, the setting is off.
	 * @return {void}
	 */
	function provideProductsSetting( {
		includesProducts,
	}: {
		includesProducts: boolean;
	} ) {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry, {
			wooCommerceActive: true,
			productPathPrefix: '/product/',
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: includesProducts,
		} );
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
		// Storing the settings stops a request for them when a column renders a
		// report error.
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

	it( "should render the visitors of each row with its share of the site's visitors, in every column", async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		// Every column divides by the site's 120 visitors, the referrals too.
		expect( getRowTexts( getColumn( 'Top posts by visitors' ) ) ).toEqual( [
			[ 'Ice cream is good for your health', '82(68.3%)' ],
			[ 'Use SPF every day & in winter', '21(17.5%)' ],
			[ 'Stay hydrated', '8(6.7%)' ],
		] );
		expect(
			getRowTexts( getColumn( 'Top channels by visitors' ) )
		).toEqual( [
			[ 'Direct', '82(68.3%)' ],
			[ 'Organic Search', '21(17.5%)' ],
			[ 'Referral', '12(10%)' ],
		] );
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(6.7%)' ],
			[ 'forum.example.com', '4(3.3%)' ],
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

	it( 'should not request a title for a page that had no visitors', async () => {
		// A report includes values with no visitors, so one of its three rows
		// can be a page with none.
		mockReportRequests( {
			posts: {
				body: {
					dimensionHeaders: [ { name: 'pagePath' } ],
					...createBreakdownReport( [
						[ '/ice-cream/', 82 ],
						[ '/spf/', 21 ],
						[ '/summer-hats/', 0 ],
					] ),
				},
				status: 200,
			},
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, titlesRequest );

		const [ [ titlesURL ] ] = fetchMock.calls( titlesRequest );
		const requestedPaths = Array.from(
			new URL( titlesURL, 'http://example.com' ).searchParams.entries()
		)
			.filter( ( [ key ] ) =>
				key.startsWith( 'dimensionFilters[pagePath]' )
			)
			.map( ( [ , value ] ) => value );

		expect( requestedPaths ).toEqual( [ '/ice-cream/', '/spf/' ] );
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
				body: {
					dimensionHeaders: [ { name: 'pagePath' } ],
					...createBreakdownReport( [
						[ '//spam.example/offer/', 90 ],
						[ '/ice-cream/', 82 ],
					] ),
				},
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

		expect(
			new URL( referralsURL, 'http://example.com' ).searchParams.get(
				'dimensionFilters[sessionDefaultChannelGroup]'
			)
		).toBe( 'Referral' );
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(6.7%)' ],
			[ 'forum.example.com', '4(3.3%)' ],
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

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
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

		// The three columns read the same report of the site's visitors, which
		// didn't fail, so the other two columns keep their rows.
		expect(
			getColumn( 'Top posts by visitors' ).querySelector(
				'.googlesitekit-table-tile__loading'
			)
		).not.toBeInTheDocument();
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(6.7%)' ],
			[ 'forum.example.com', '4(3.3%)' ],
		] );
		expect( fetchMock ).toHaveFetchedTimes( 1, siteVisitorsRequest );
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

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
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

	it( 'should render a report error in the posts column when the request for the post titles fails', async () => {
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
			postsColumn.querySelector( '.googlesitekit-table-tile__error' )
		).toHaveTextContent( 'Test error message' );
		expect(
			postsColumn.querySelector( '.googlesitekit-table-tile__loading' )
		).not.toBeInTheDocument();
	} );

	it( 'should request the post titles again, and render them, when "Retry" is clicked after their request fails', async () => {
		fetchMock.getOnce( titlesRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( titlesRequest, {
			body: titlesReport,
			status: 200,
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top posts by visitors' ) ).getByRole(
				'button',
				{ name: 'Retry' }
			)
		);

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, titlesRequest );
		// The report of pages didn't fail, so it isn't requested again.
		expect( fetchMock ).toHaveFetchedTimes( 1, postsRequest );
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
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
		freezeFetch( reportEndpoint, { repeat: 4 } );

		const { container } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect(
			container.querySelectorAll( '.googlesitekit-table-tile__loading' )
		).toHaveLength( 3 );
	} );

	it( 'should render "No data to display: no traffic from other sites to yours" in the referrals column, and the rows of the other two columns, when no visitor came from another site', async () => {
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

	it( 'should render "No data to display: your site hasn’t received any visitors yet" in the posts and channels columns when the site had no visitors', async () => {
		mockReportRequests( {
			posts: { body: {}, status: 200 },
			channels: { body: {}, status: 200 },
			referrals: { body: {}, status: 200 },
			siteVisitors: {
				body: createSiteVisitorsReport( 0 ),
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

	it( "should render a report error in each column when the request for the site's visitors fails", async () => {
		mockReportRequests( {
			siteVisitors: { body: errorResponse, status: 500 },
		} );

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect(
			[
				'Top posts by visitors',
				'Top channels by visitors',
				'Top referrals by visitors',
			].map(
				( title ) =>
					getColumn( title ).querySelector(
						'.googlesitekit-table-tile__error'
					)?.textContent
			)
		).toEqual( [
			expect.stringContaining( 'Test error message' ),
			expect.stringContaining( 'Test error message' ),
			expect.stringContaining( 'Test error message' ),
		] );
	} );

	it( 'should request the site\'s visitors again, and render the shares in every column, when "Retry" is clicked after that request fails', async () => {
		fetchMock.getOnce( siteVisitorsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( siteVisitorsRequest, {
			body: siteVisitorsReport,
			status: 200,
		} );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top channels by visitors' ) ).getByRole(
				'button',
				{ name: 'Retry' }
			)
		);

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, siteVisitorsRequest );
		// The `getReport` resolver sends no request for a report the store
		// already has, so the column reports, which didn't fail, aren't
		// requested again.
		expect( fetchMock ).toHaveFetchedTimes( 1, channelsRequest );
		expect(
			getRowTexts( getColumn( 'Top channels by visitors' ) )
		).toEqual( [
			[ 'Direct', '82(68.3%)' ],
			[ 'Organic Search', '21(17.5%)' ],
			[ 'Referral', '12(10%)' ],
		] );
		expect(
			getRowTexts( getColumn( 'Top referrals by visitors' ) )
		).toEqual( [
			[ 'news.example.com', '8(6.7%)' ],
			[ 'forum.example.com', '4(3.3%)' ],
		] );
	} );

	it( 'should request the posts without the pages under the product path when the setting to include products is off', async () => {
		provideProductsSetting( { includesProducts: false } );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
			features: [ 'freshData' ],
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, postsRequest );
		expect( getPostsRequestPagePathFilter() ).toEqual( {
			'dimensionFilters[pagePath][filterType]': 'stringFilter',
			'dimensionFilters[pagePath][matchType]': 'BEGINS_WITH',
			'dimensionFilters[pagePath][value]': '/product/',
			'dimensionFilters[pagePath][notExpression]': 'true',
		} );
		expect(
			within( getColumn( 'Top posts by visitors' ) ).getAllByRole(
				'link'
			)
		).toHaveLength( 3 );
	} );

	it( 'should request the posts with the pages under the product path when the setting to include products is on', async () => {
		provideProductsSetting( { includesProducts: true } );
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
			features: [ 'freshData' ],
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, postsRequest );
		expect( getPostsRequestPagePathFilter() ).toEqual( {} );
	} );

	it( 'should render the loading state in the posts column, and should not request the posts, while the setting to include products loads', async () => {
		// We create a registry whose Analytics settings haven't loaded, and the
		// request that would load them never finishes.
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

	it( 'should omit the "Top posts by visitors" column, and should not request its report, when the site has no published posts', async () => {
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
} );
