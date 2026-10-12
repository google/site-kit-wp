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
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
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

	// The site had 120 visitors, and 12 of them came from other sites. Each
	// report's total counts a visitor once.
	const postsReport: Report = {
		dimensionHeaders: [ { name: 'pagePath' } ],
		...createBreakdownReport(
			[
				[ '/ice-cream/', 82 ],
				[ '/spf/', 21 ],
				[ '/hydration/', 8 ],
			],
			120
		),
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
			[ 'substack.com', 8 ],
			[ 'reddit.com', 4 ],
		],
		12
	);

	// `ReportError` shows its own message for some error codes, so this code
	// keeps the message of the response.
	const errorResponse = {
		code: 'test_error',
		message: 'Test error message',
		data: { status: 500, reason: 'internalError' },
	};

	/**
	 * Answers the four report requests of the section: the posts, their
	 * titles, the channels and the referrals.
	 *
	 * Each request gets its report above, unless `responses` gives it another
	 * response. A route registered before this call answers first, so a test
	 * that needs a request to fail once, or to wait, registers that route
	 * before calling this.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [responses]           The responses that replace the reports above.
	 * @param {Object} [responses.posts]     The response to the request for the posts.
	 * @param {Object} [responses.titles]    The response to the request for the post titles.
	 * @param {Object} [responses.channels]  The response to the request for the channels.
	 * @param {Object} [responses.referrals] The response to the request for the referrals.
	 * @return {void}
	 */
	function mockReportRequests(
		responses: Partial<
			Record<
				'posts' | 'titles' | 'channels' | 'referrals',
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
	}

	/**
	 * Gets the column with the given title.
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
	 * Gets the label and the value of each row of a column, as they read.
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

	it( "should render the visitors of each row with its share of the visitor total of the column's report", async () => {
		mockReportRequests();

		const { waitForRegistry } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForRegistry();

		// The channels divide by the site's 120 visitors, and the referrals by
		// the 12 who came from other sites.
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
			[ 'substack.com', '8(66.7%)' ],
			[ 'reddit.com', '4(33.3%)' ],
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
		// A report keeps the values with no visitors, so its three rows can
		// hold a page that had none.
		mockReportRequests( {
			posts: {
				body: {
					dimensionHeaders: [ { name: 'pagePath' } ],
					...createBreakdownReport(
						[
							[ '/ice-cream/', 82 ],
							[ '/spf/', 21 ],
							[ '/summer-hats/', 0 ],
						],
						90
					),
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

	it( 'should render a page that Analytics has no title for by its path', async () => {
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
					...createBreakdownReport(
						[
							[ '//spam.example/offer/', 90 ],
							[ '/ice-cream/', 82 ],
						],
						172
					),
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
			within( getColumn( 'Top referrals by visitors' ) )
				.getAllByText( /\.com$/ )
				.map( ( label ) => label.textContent )
		).toEqual( [ 'substack.com', 'reddit.com' ] );
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
				'substack.com'
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

		// A `waitForRegistry` resolves only once, so a new one waits for the
		// retry.
		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top channels by visitors' ) ).getByRole(
				'button',
				{ name: /retry/i }
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

		// A `waitForRegistry` resolves only once, so a new one waits for the
		// retry.
		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top posts by visitors' ) ).getByRole(
				'button',
				{ name: /retry/i }
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

		// A `waitForRegistry` resolves only once, so a new one waits for the
		// retry.
		const waitForRetry = createWaitForRegistry( registry );

		fireEvent.click(
			within( getColumn( 'Top posts by visitors' ) ).getByRole(
				'button',
				{ name: /retry/i }
			)
		);

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, titlesRequest );
		// The report of pages had not failed, so it is not requested again.
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
		freezeFetch( reportEndpoint, { repeat: 3 } );

		const { container } = render( <RecentTrafficBreakdown />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect(
			container.querySelectorAll( '.googlesitekit-table-tile__loading' )
		).toHaveLength( 3 );
	} );

	it( 'should render the zero state in a column whose report has no visitors', async () => {
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
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect(
			within( getColumn( 'Top channels by visitors' ) ).getByText(
				'Direct'
			)
		).toBeInTheDocument();
	} );

	it( 'should leave out the "Top posts by visitors" column, and should not request its report, when the site has no published posts', async () => {
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
