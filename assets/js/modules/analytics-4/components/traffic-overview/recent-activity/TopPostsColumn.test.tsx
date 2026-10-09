/**
 * Recent activity "Top posts by visitors" column tests.
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
import { getRecentTopPostsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { createTestRegistry, render, waitFor } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import TopPostsColumn from './TopPostsColumn';

describe( 'TopPostsColumn', () => {
	let registry: WPDataRegistry;

	const reportArgs = getRecentTopPostsReportArgs( {
		startDate: '2025-02-04',
		endDate: '2025-02-05',
	} );

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
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
	} );

	it( 'should render the title of each post in place of its page path, linked to the page', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			createBreakdownReport( [
				[ '/ice-cream/', 82 ],
				[ '/stay-hydrated/', 8 ],
			] ),
			{ options: reportArgs }
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
					{
						dimensionValues: [
							{ value: '/stay-hydrated/' },
							{ value: 'Stay hydrated' },
						],
					},
				],
			},
			{
				options: getPageTitlesReportOptions( reportArgs, [
					'/ice-cream/',
					'/stay-hydrated/',
				] ),
			}
		);

		const { getByRole, queryByText, waitForRegistry } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByRole( 'link', {
				name: 'Ice cream is good for your health (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'http://example.com/ice-cream/' );
		expect(
			getByRole( 'link', {
				name: 'Stay hydrated (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'http://example.com/stay-hydrated/' );
		expect( queryByText( '/ice-cream/' ) ).not.toBeInTheDocument();
	} );

	it( 'should request titles for the three posts it shows, and not for every post with visitors', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			createBreakdownReport( [
				[ '/first/', 50 ],
				[ '/second/', 40 ],
				[ '/third/', 30 ],
				[ '/fourth/', 20 ],
				[ '/fifth/', 10 ],
			] ),
			{ options: reportArgs }
		);
		// The titles report for the three shown posts is already loaded, so
		// a request for any other titles report would reach `fetchMock`.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getPageTitlesReportOptions( reportArgs, [
					'/first/',
					'/second/',
					'/third/',
				] ),
			}
		);

		const { getByText, waitForRegistry } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( getByText( '/third/' ) ).toBeInTheDocument();
	} );

	it( 'should render the page path of a post that has no title', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ '/untitled/', 12 ] ] ),
				{ options: reportArgs }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getPageTitlesReportOptions( reportArgs, [
					'/untitled/',
				] ),
			}
		);

		const { getByRole, waitForRegistry } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByRole( 'link', {
				name: '/untitled/ (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'http://example.com/untitled/' );
	} );

	it( 'should render a "(not set)" page path without a link', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ '(not set)', 3 ] ] ),
				{ options: reportArgs }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getPageTitlesReportOptions( reportArgs, [
					'(not set)',
				] ),
			}
		);

		const { getByText, queryByRole, waitForRegistry } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '(not set)' ) ).toBeInTheDocument();
		expect( queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the loading state, and no row, while the titles load', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ '/ice-cream/', 82 ] ] ),
				{ options: reportArgs }
			);
		freezeFetch( reportEndpoint );

		const { container } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( reportEndpoint )
		);

		expect(
			container.querySelector( '.googlesitekit-table-tile__loading' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-table-tile__row' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the "Data error in Analytics" error when the request for the titles fails', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [ [ '/ice-cream/', 82 ] ] ),
				{ options: reportArgs }
			);
		fetchMock.getOnce( reportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { findByText } = render(
			<TopPostsColumn reportArgs={ reportArgs } />,
			{ registry }
		);

		expect(
			await findByText( 'Data error in Analytics' )
		).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );
} );
