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
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import LatestPostPerformance from './LatestPostPerformance';

const VISITOR_BREAKDOWN_ROWS = [
	[ 'Total visitors', '94' ],
	[ 'New visitors', '66' ],
	[ 'Returning visitors', '28' ],
];

const ANALYTICS_TRAFFIC_SOURCES_ROWS = [
	[ 'Top traffic source', 'Organic Social' ],
	[ 'Top referring site', 'substack.com' ],
];

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
				rows: VISITOR_BREAKDOWN_ROWS,
			},
			{
				title: 'Traffic sources',
				rows: [
					...ANALYTICS_TRAFFIC_SOURCES_ROWS,
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

		expect( tiles[ 0 ].rows ).toEqual( VISITOR_BREAKDOWN_ROWS );
		expect( tiles[ 1 ].rows ).toEqual( [
			...ANALYTICS_TRAFFIC_SOURCES_ROWS,
			[
				'Top keyword',
				expect.stringContaining( 'Search Console is unavailable.' ),
			],
		] );
		expect(
			container.querySelectorAll( '.googlesitekit-cta--error' )
		).toHaveLength( 1 );
	} );

	it( 'should keep the reports on the date range of the post when the dashboard date range changes', async () => {
		provideLatestPostKeywordReport( registry );

		const { container, waitForRegistry } = render(
			<LatestPostPerformance />,
			{ registry }
		);

		await waitForRegistry();

		const tilesBefore = getTiles( container );

		registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );

		await waitForRegistry();

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

		expect( getTiles( container )[ 1 ].rows ).toEqual(
			ANALYTICS_TRAFFIC_SOURCES_ROWS
		);
	} );
} );
