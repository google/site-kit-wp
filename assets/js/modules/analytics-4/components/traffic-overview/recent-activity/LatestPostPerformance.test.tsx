/**
 * Recent activity latest post performance tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import {
	getLatestPostAnalyticsReportOptions,
	getLatestPostKeywordReportOptions,
	provideLatestPost,
	provideLatestPostAnalyticsReports,
	provideLatestPostKeywordReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import LatestPostPerformance from './LatestPostPerformance';

describe( 'LatestPostPerformance', () => {
	let registry: WPDataRegistry;

	/**
	 * Gets the title and the label and value of each row of each tile, in
	 * the order the tiles appear.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The element the section rendered into.
	 * @return {Array<Object>} The title and the rows of each tile.
	 */
	function getTiles( container: Element ) {
		return Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__latest-post-tile'
			)
		).map( ( tile ) => ( {
			title: tile.querySelector( '.googlesitekit-table-tile__title' )
				?.textContent,
			rows: Array.from(
				tile.querySelectorAll( '.googlesitekit-table-tile__row' )
			).map( ( row ) =>
				Array.from( row.children ).map( ( cell ) => cell.textContent )
			),
		} ) );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			detectedEvents: [ 'purchase' ],
		} );
		provideLatestPost( registry );
		provideLatestPostAnalyticsReports( registry );
	} );

	it( 'should render the section heading and the post title linking to the entity dashboard of the post', async () => {
		provideLatestPostKeywordReport( registry );

		const { getByRole, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByRole( 'region', {
				name: 'Latest post performance since published',
			} )
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: 'Ice cream is good for your health' } )
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2Fice-cream%2F'
		);
	} );

	it( 'should render the visitor breakdown, traffic sources, and engagement and outcomes tiles with their rows', async () => {
		provideLatestPostKeywordReport( registry );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect( getTiles( container ) ).toEqual( [
			{
				title: 'Visitor breakdown',
				rows: [
					[ 'Total visitors', '94' ],
					[ 'New visitors', '66' ],
					[ 'Returning visitors', '28' ],
				],
			},
			{
				title: 'Traffic sources',
				rows: [
					[ 'Top traffic source', 'Organic Social' ],
					[ 'Top referring site', 'substack.com' ],
					[ 'Top keyword', 'healthy ice cream' ],
				],
			},
			{
				title: 'Engagement & outcomes',
				rows: [
					[ 'Session Duration', '1m 16s' ],
					[ 'Engaged sessions', '18' ],
					[ 'Purchases affected by post', '4' ],
				],
			},
		] );
	} );

	it( 'should set each value as the title of its cell, so a value that is cut off can be read in full', async () => {
		provideLatestPostKeywordReport( registry );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			Array.from(
				container.querySelectorAll(
					'.googlesitekit-table-tile__cell--value'
				),
				( cell ) => cell.getAttribute( 'title' )
			)
		).toEqual( [
			'94',
			'66',
			'28',
			'Organic Social',
			'substack.com',
			'healthy ice cream',
			'1m 16s',
			'18',
			'4',
		] );
	} );

	it( 'should leave out the purchases row, rather than showing zero, when Site Goals has detected no conversion event', async () => {
		provideLatestPostKeywordReport( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		const { container, queryByText, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect( queryByText( 'Purchases affected by post' ) ).toBeNull();
		expect( getTiles( container )[ 2 ].rows ).toEqual( [
			[ 'Session Duration', '1m 16s' ],
			[ 'Engaged sessions', '18' ],
		] );
	} );

	it( 'should leave out the purchases row when Site Goals has detected an "add_to_cart" event but no "purchase" event', async () => {
		provideLatestPostKeywordReport( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'add_to_cart' ] );

		const { queryByText, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect( queryByText( 'Purchases affected by post' ) ).toBeNull();
	} );

	it( 'should render the settings error in the purchases row, rather than loading forever, when the Analytics settings request fails', async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		provideLatestPost( registry );
		provideLatestPostAnalyticsReports( registry );
		provideLatestPostKeywordReport( registry );
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/settings'
			),
			{
				body: {
					code: 'internal_server_error',
					message: 'The settings are unavailable.',
					data: { status: 500 },
				},
				status: 500,
			}
		);

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect( getTiles( container )[ 2 ].rows ).toEqual( [
			[ 'Session Duration', '1m 16s' ],
			[ 'Engaged sessions', '18' ],
			[
				'Purchases affected by post',
				expect.stringContaining( 'Data error in Analytics' ),
			],
		] );
		expect( console ).toHaveErrored();
	} );

	it( 'should render a report error in the top keyword row only, and should keep the Analytics rows, when the Search Console report fails', async () => {
		const keywordReportOptions =
			getLatestPostKeywordReportOptions( registry );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'Search Console is unavailable.',
				data: {},
			},
			'getReport',
			[ keywordReportOptions ]
		);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ keywordReportOptions ] );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tiles = getTiles( container );

		expect( tiles[ 0 ].rows ).toEqual( [
			[ 'Total visitors', '94' ],
			[ 'New visitors', '66' ],
			[ 'Returning visitors', '28' ],
		] );
		expect( tiles[ 1 ].rows ).toEqual( [
			[ 'Top traffic source', 'Organic Social' ],
			[ 'Top referring site', 'substack.com' ],
			[
				'Top keyword',
				expect.stringContaining( 'Search Console is unavailable.' ),
			],
		] );
		expect(
			container.querySelectorAll( '.googlesitekit-cta--error' )
		).toHaveLength( 1 );
	} );

	it( 'should render a report error in place of the visitor breakdown rows only, and should keep the other tiles, when the visitors report fails', async () => {
		provideLatestPostKeywordReport( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The visitors report is unavailable.',
				data: {},
			},
			'getReport',
			[ getLatestPostAnalyticsReportOptions( registry ).visitors ]
		);

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tiles = getTiles( container );

		expect( tiles[ 0 ].rows ).toEqual( [] );
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__latest-post-tile'
			)[ 0 ]
		).toHaveTextContent( 'The visitors report is unavailable.' );
		expect( tiles[ 1 ].rows ).toEqual( [
			[ 'Top traffic source', 'Organic Social' ],
			[ 'Top referring site', 'substack.com' ],
			[ 'Top keyword', 'healthy ice cream' ],
		] );
		expect( tiles[ 2 ].rows ).toEqual( [
			[ 'Session Duration', '1m 16s' ],
			[ 'Engaged sessions', '18' ],
			[ 'Purchases affected by post', '4' ],
		] );
		expect(
			container.querySelectorAll( '.googlesitekit-cta--error' )
		).toHaveLength( 1 );
	} );

	it( 'should render a report error in place of the engagement rows only, and should keep the purchases row, when the engagement report fails', async () => {
		provideLatestPostKeywordReport( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The engagement report is unavailable.',
				data: {},
			},
			'getReport',
			[ getLatestPostAnalyticsReportOptions( registry ).engagement ]
		);

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tiles = getTiles( container );

		expect( tiles[ 0 ].rows ).toEqual( [
			[ 'Total visitors', '94' ],
			[ 'New visitors', '66' ],
			[ 'Returning visitors', '28' ],
		] );
		expect( tiles[ 1 ].rows ).toEqual( [
			[ 'Top traffic source', 'Organic Social' ],
			[ 'Top referring site', 'substack.com' ],
			[ 'Top keyword', 'healthy ice cream' ],
		] );
		expect( tiles[ 2 ].rows ).toEqual( [
			[ 'Purchases affected by post', '4' ],
		] );
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__latest-post-tile'
			)[ 2 ]
		).toHaveTextContent( 'The engagement report is unavailable.' );
		expect(
			container.querySelectorAll( '.googlesitekit-cta--error' )
		).toHaveLength( 1 );
	} );

	it( 'should render a report error in the top traffic source and top referring site rows only, and should keep the top keyword row, when their reports fail', async () => {
		provideLatestPostKeywordReport( registry );
		const { topChannel, topReferrer } =
			getLatestPostAnalyticsReportOptions( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The top channel report is unavailable.',
				data: {},
			},
			'getReport',
			[ topChannel ]
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The top referrer report is unavailable.',
				data: {},
			},
			'getReport',
			[ topReferrer ]
		);

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tiles = getTiles( container );

		expect( tiles[ 0 ].rows ).toEqual( [
			[ 'Total visitors', '94' ],
			[ 'New visitors', '66' ],
			[ 'Returning visitors', '28' ],
		] );
		expect( tiles[ 1 ].rows ).toEqual( [
			[
				'Top traffic source',
				expect.stringContaining(
					'The top channel report is unavailable.'
				),
			],
			[
				'Top referring site',
				expect.stringContaining(
					'The top referrer report is unavailable.'
				),
			],
			[ 'Top keyword', 'healthy ice cream' ],
		] );
		expect( tiles[ 2 ].rows ).toEqual( [
			[ 'Session Duration', '1m 16s' ],
			[ 'Engaged sessions', '18' ],
			[ 'Purchases affected by post', '4' ],
		] );
		expect(
			container.querySelectorAll( '.googlesitekit-cta--error' )
		).toHaveLength( 2 );
	} );

	it( 'should render a loading block in the top traffic source row only while the top channel report loads', async () => {
		provideLatestPostKeywordReport( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				getLatestPostAnalyticsReportOptions( registry ).topChannel,
			] );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tiles = getTiles( container );

		expect( tiles[ 0 ].rows ).toEqual( [
			[ 'Total visitors', '94' ],
			[ 'New visitors', '66' ],
			[ 'Returning visitors', '28' ],
		] );
		expect( tiles[ 1 ].rows ).toEqual( [
			[ 'Top traffic source', '' ],
			[ 'Top referring site', 'substack.com' ],
			[ 'Top keyword', 'healthy ice cream' ],
		] );
		expect( tiles[ 2 ].rows ).toEqual( [
			[ 'Session Duration', '1m 16s' ],
			[ 'Engaged sessions', '18' ],
			[ 'Purchases affected by post', '4' ],
		] );
		expect(
			container.querySelectorAll( '.googlesitekit-preview-block' )
		).toHaveLength( 1 );
	} );

	it( 'should render a report error in place of the tiles when the latest post request fails', async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		fetchMock.get( new RegExp( '^/wp/v2/posts' ), {
			body: {
				code: 'internal_server_error',
				message: 'The posts are unavailable.',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Data error in Analytics' );
		expect( getTiles( container ) ).toEqual( [] );
		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).not.toBeInTheDocument();
	} );

	it( 'should render a loading block in place of the tiles while the latest post loads', async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		freezeFetch( new RegExp( '^/wp/v2/posts' ) );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
		expect( getTiles( container ) ).toEqual( [] );
	} );

	it( 'should keep the reports on the date range of the post when the dashboard date range changes', async () => {
		provideLatestPostKeywordReport( registry );
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report'
			),
			{ body: {}, status: 200 }
		);
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{ body: [], status: 200 }
		);

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tilesBefore = getTiles( container );

		registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );

		await waitForDefaultTimeouts();

		expect( getTiles( container ) ).toEqual( tilesBefore );
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should leave out the top keyword row for a view-only user who cannot view Search Console', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: false,
		} );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( getTiles( container )[ 1 ].rows ).toEqual( [
			[ 'Top traffic source', 'Organic Social' ],
			[ 'Top referring site', 'substack.com' ],
		] );
	} );
} );
