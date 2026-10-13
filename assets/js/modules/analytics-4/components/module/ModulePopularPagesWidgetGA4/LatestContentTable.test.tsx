/**
 * LatestContentTable component tests.
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
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { act, createTestRegistry, render, waitFor } from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
} from '@tests/js/utils';
import { getLatestContentReportArgs } from './latestContentReportOptions';
import LatestContentTable from './LatestContentTable';

jest.mock( '@/js/hooks/useBreakpoint', () => ( {
	...jest.requireActual( '@/js/hooks/useBreakpoint' ),
	useBreakpoint: jest.fn(),
} ) );

// The site runs seven hours behind UTC, so in UTC the first post was
// published on the next day.
const RECENT_CONTENT: RecentContentItem[] = [
	{
		id: 3,
		title: 'Published this morning',
		permalink: 'http://example.com/published-this-morning/',
		pagePath: '/published-this-morning/',
		publishedAt: '2026-10-08T06:30:00Z',
		sitePublishedAt: '2026-10-07T23:30:00',
	},
	{
		id: 2,
		title: 'Popular older post',
		permalink: 'http://example.com/popular-older-post/',
		pagePath: '/popular-older-post/',
		publishedAt: '2026-10-01T19:05:00Z',
		sitePublishedAt: '2026-10-01T12:05:00',
	},
];

const REPORT = {
	rows: [
		{
			dimensionValues: [ { value: '/popular-older-post/' } ],
			metricValues: [
				{ value: '1200' },
				{ value: '1000' },
				{ value: '0.75' },
				{ value: '76' },
			],
		},
	],
};

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

const ERROR = {
	code: 'test_error',
	message: 'Error message.',
	data: {},
};

describe( 'LatestContentTable', () => {
	let registry: WPDataRegistry;

	const { WidgetReportError } = getWidgetComponentProps(
		'analyticsModulePopularPagesGA4'
	) as { WidgetReportError: ElementType };

	function getReportArgs() {
		return getLatestContentReportArgs(
			registry.select( CORE_USER ).getDateRangeDates(),
			RECENT_CONTENT.map( ( { pagePath } ) => pagePath )
		);
	}

	function receiveRecentContent( recentContent: RecentContentItem[] ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetRecentContent( recentContent, {
				count: 10,
				includeProducts: false,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getRecentContent', [ { count: 10 } ] );
	}

	function getHeaders( container: Element ) {
		return Array.from(
			container.querySelectorAll( '.googlesitekit-table__head-item' )
		).map( ( header ) => header.textContent );
	}

	function renderTable() {
		return render(
			<LatestContentTable WidgetReportError={ WidgetReportError } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
	}

	beforeEach( () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		receiveRecentContent( RECENT_CONTENT );
	} );

	it( 'should render the posted date and time, title and metric columns with the title link and path', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, getByRole, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect( getHeaders( container ) ).toEqual( [
			'Posted',
			'Time',
			'Title',
			'Pageviews',
			'Sessions',
			'Engaged Sessions',
			'Session Duration',
		] );

		expect(
			getByRole( 'link', { name: 'Published this morning' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: '/published-this-morning/' } )
		).toHaveAttribute(
			'href',
			'http://example.com/published-this-morning/'
		);
	} );

	it( 'should show the publish date and time in the site time zone', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, waitForRegistry } = renderTable();

		await waitForRegistry();

		const postedCells = Array.from(
			container.querySelectorAll( '.googlesitekit-table__body-row' )
		).map( ( row ) =>
			Array.from(
				row.querySelectorAll( '.googlesitekit-table__body-item' )
			)
				.slice( 0, 2 )
				.map( ( cell ) => cell.textContent )
		);

		expect( postedCells ).toEqual( [
			[ 'Oct 7', '11:30 PM' ],
			[ 'Oct 1', '12:05 PM' ],
		] );
	} );

	it( 'should keep a post with no Analytics row and show zeros for it', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, waitForRegistry } = renderTable();

		await waitForRegistry();

		const rows = Array.from(
			container.querySelectorAll( '.googlesitekit-table__body-row' )
		).map( ( row ) =>
			Array.from(
				row.querySelectorAll( '.googlesitekit-table__body-item' )
			)
				.slice( 2 )
				.map( ( cell ) => cell.textContent )
		);

		expect( rows ).toEqual( [
			[
				'Published this morning/published-this-morning/',
				'0',
				'0',
				'0%',
				'0s',
			],
			[
				'Popular older post/popular-older-post/',
				'1,200',
				'1,000',
				'75%',
				'1m 16s',
			],
		] );
	} );

	it( 'should request the listed paths again when the dashboard date range changes', async () => {
		fetchMock.get( reportEndpoint, { body: REPORT, status: 200 } );

		const { waitForRegistry } = renderTable();

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint );

		const firstURL = decodeURIComponent(
			fetchMock.lastCall( reportEndpoint )?.[ 0 ] ?? ''
		);

		expect( firstURL ).toContain( 'startDate=2026-09-11' );
		expect( firstURL ).toContain( 'dimensionFilters' );
		expect( firstURL ).toContain( '/published-this-morning/' );
		expect( firstURL ).toContain( '/popular-older-post/' );

		await act( async () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
			await waitFor( () =>
				expect( fetchMock ).toHaveFetchedTimes( 2, reportEndpoint )
			);
		} );

		const secondURL = decodeURIComponent(
			fetchMock.lastCall( reportEndpoint )?.[ 0 ] ?? ''
		);

		expect( secondURL ).toContain( 'startDate=2026-10-02' );
		expect( secondURL ).toContain( '/published-this-morning/' );
		expect( secondURL ).toContain( '/popular-older-post/' );
	} );

	it( 'should show the skeleton while the report loads', async () => {
		fetchMock.get( reportEndpoint, new Promise( () => {} ) );

		const { container, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-preview-table' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-table__body-row' )
		).not.toBeInTheDocument();
	} );

	it( 'should still show the WordPress rows without the metric columns when the report fails', async () => {
		const args = getReportArgs();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( ERROR, 'getReport', [ args ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ args ] );

		const { container, getByText, getByRole, waitForRegistry } =
			renderTable();

		await waitForRegistry();

		expect( getByText( /Error message\./ ) ).toBeInTheDocument();
		expect( getHeaders( container ) ).toEqual( [
			'Posted',
			'Time',
			'Title',
		] );
		expect(
			getByRole( 'link', { name: 'Published this morning' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: 'Popular older post' } )
		).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-table__body-row' )
		).toHaveLength( 2 );
	} );

	it( 'should show an error and no table when the posts fail to load', async () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( ERROR, 'getRecentContent', [
				{ count: 10 },
			] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getRecentContent', [ { count: 10 } ] );

		const { container, getByText, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect( getByText( /Error message\./ ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-table' )
		).not.toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should show a message and request no report when the site has no published posts', async () => {
		receiveRecentContent( [] );

		const { getByText, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect(
			getByText(
				'No published content yet: your latest posts will appear here once you publish them'
			)
		).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should show the gathering data notice instead of zeros', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, getByText, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect( getByText( /gathering data/i ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-table__body-row:not(.googlesitekit-table__body-row--no-data)'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should show the title with its publish time and one metric at a time on small screens', async () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_SMALL );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, getAllByRole, waitForRegistry } = renderTable();

		await waitForRegistry();

		expect(
			getAllByRole( 'tab' ).map( ( tab ) => tab.textContent )
		).toEqual( [
			'Pageviews',
			'Sessions',
			'Engaged Sessions',
			'Session Duration',
		] );

		const firstRowCells = Array.from(
			container.querySelectorAll(
				'.googlesitekit-table__body-row:first-child .googlesitekit-table__body-item'
			)
		).map( ( cell ) => cell.textContent );

		expect( firstRowCells ).toEqual( [
			'Oct 7 11:30 PMPublished this morning/published-this-morning/',
			'0',
		] );
	} );
} );
