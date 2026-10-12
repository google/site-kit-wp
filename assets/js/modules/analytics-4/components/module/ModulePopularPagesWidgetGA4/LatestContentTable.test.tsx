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

const RECENT_CONTENT: RecentContentItem[] = [
	{
		id: 3,
		title: 'Published this morning',
		permalink: 'http://example.com/published-this-morning/',
		pagePath: '/published-this-morning/',
		publishedAt: '2026-10-07T12:00:00Z',
	},
	{
		id: 2,
		title: 'Popular older post',
		permalink: 'http://example.com/popular-older-post/',
		pagePath: '/popular-older-post/',
		publishedAt: '2026-10-01T12:00:00Z',
	},
];

const REPORT = {
	rows: [
		{
			dimensionValues: [ { value: '/popular-older-post/' } ],
			metricValues: [
				{ value: '1200' },
				{ value: '1000' },
				{ value: '750' },
				{ value: '76' },
			],
		},
	],
};

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

describe( 'LatestContentTable', () => {
	let registry: WPDataRegistry;

	const { Widget, WidgetReportError } = getWidgetComponentProps(
		'analyticsModulePopularPagesGA4'
	) as { Widget: ElementType; WidgetReportError: ElementType };

	function getReportArgs() {
		return getLatestContentReportArgs(
			registry.select( CORE_USER ).getDateRangeDates(),
			RECENT_CONTENT.map( ( { pagePath } ) => pagePath )
		);
	}

	function renderTable() {
		return render(
			<LatestContentTable
				Widget={ Widget }
				WidgetReportError={ WidgetReportError }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
	}

	beforeEach( () => {
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
			.receiveGetRecentContent( RECENT_CONTENT, {
				count: 10,
				includeProducts: false,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getRecentContent', [ { count: 10 } ] );
	} );

	it( 'should render the six columns with the title link and path', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( REPORT, {
			options: getReportArgs(),
		} );

		const { container, getByRole, waitForRegistry } = renderTable();

		await waitForRegistry();

		const headers = Array.from(
			container.querySelectorAll( '.googlesitekit-table__head-item' )
		).map( ( header ) => header.textContent );

		expect( headers ).toEqual( [
			'Posted',
			'',
			'Title',
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

		expect( firstRowCells[ 0 ] ).toBe( 'Oct 7' );
		expect( firstRowCells[ 1 ] ).toMatch( /\d{1,2}:\d{2}/ );

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

	it( 'should request the report again when the dashboard date range changes', async () => {
		fetchMock.get( reportEndpoint, { body: REPORT, status: 200 } );

		const { waitForRegistry } = renderTable();

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint );
		expect( fetchMock.lastCall( reportEndpoint )?.[ 0 ] ).toEqual(
			expect.stringContaining( 'startDate=2026-09-11' )
		);

		await act( async () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
			await waitFor( () =>
				expect( fetchMock ).toHaveFetchedTimes( 2, reportEndpoint )
			);
		} );

		expect( fetchMock.lastCall( reportEndpoint )?.[ 0 ] ).toEqual(
			expect.stringContaining( 'startDate=2026-10-02' )
		);
	} );

	it( 'should still show the WordPress rows when the report fails', async () => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};
		const args = getReportArgs();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [ args ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ args ] );

		const { container, getByText, getByRole, waitForRegistry } =
			renderTable();

		await waitForRegistry();

		expect( getByText( /Error message\./ ) ).toBeInTheDocument();
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
} );
