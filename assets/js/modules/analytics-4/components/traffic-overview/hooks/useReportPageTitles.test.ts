/**
 * Traffic Overview `useReportPageTitles` hook tests.
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getTopPostsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { createTitlesReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, waitForDefaultTimeouts } from '@tests/js/utils';
import { useReportPageTitles } from './useReportPageTitles';

describe( 'useReportPageTitles', () => {
	let registry: WPDataRegistry;

	const titlesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const reportOptions = getTopPostsReportOptions( {
		startDate: '2025-02-03',
		endDate: '2025-02-05',
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should return the title that Analytics records for each page path', async () => {
		fetchMock.getOnce( titlesEndpoint, {
			body: createTitlesReport( [
				[ '/ice-cream/', 'Ice cream is good for your health' ],
				[ '/spf/', 'Use SPF every day' ],
			] ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useReportPageTitles(
					[ '/ice-cream/', '/spf/' ],
					reportOptions
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			titles: {
				'/ice-cream/': 'Ice cream is good for your health',
				'/spf/': 'Use SPF every day',
			},
			loading: false,
		} );
	} );

	it( 'should request the titles of the given page paths only', async () => {
		fetchMock.getOnce( titlesEndpoint, {
			body: createTitlesReport( [
				[ '/ice-cream/', 'Ice cream is good for your health' ],
			] ),
			status: 200,
		} );

		const { waitForRegistry } = renderHook(
			() => useReportPageTitles( [ '/ice-cream/' ], reportOptions ),
			{ registry }
		);

		await waitForRegistry();

		const [ [ titlesURL ] ] = fetchMock.calls( titlesEndpoint );

		expect( getQueryArg( titlesURL, 'dimensionFilters' ) ).toEqual( {
			pagePath: [ '/ice-cream/' ],
		} );
	} );

	it( 'should return a title with `&amp;` written as `&`', async () => {
		fetchMock.getOnce( titlesEndpoint, {
			body: createTitlesReport( [
				[ '/spf/', 'Use SPF every day &amp; in winter' ],
			] ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useReportPageTitles( [ '/spf/' ], reportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.titles ).toEqual( {
			'/spf/': 'Use SPF every day & in winter',
		} );
	} );

	it( 'should return no title for a page path that Analytics has no title for', async () => {
		fetchMock.getOnce( titlesEndpoint, {
			body: createTitlesReport( [
				[ '/ice-cream/', 'Ice cream is good for your health' ],
			] ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useReportPageTitles(
					[ '/ice-cream/', '/hydration/' ],
					reportOptions
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.titles ).toEqual( {
			'/ice-cream/': 'Ice cream is good for your health',
		} );
	} );

	it( 'should be loading while the titles load', async () => {
		freezeFetch( titlesEndpoint );

		const { result } = renderHook(
			() => useReportPageTitles( [ '/ice-cream/' ], reportOptions ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).toHaveFetched( titlesEndpoint );
		expect( result.current ).toEqual( {
			titles: undefined,
			loading: true,
		} );
	} );

	it( 'should return no titles, and should not be loading, when the request for the titles fails', async () => {
		fetchMock.getOnce( titlesEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useReportPageTitles( [ '/ice-cream/' ], reportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toEqual( {
			titles: undefined,
			loading: false,
		} );
	} );

	it( 'should not request titles, and should not be loading, when there are no page paths', async () => {
		fetchMock.get( titlesEndpoint, { body: {}, status: 200 } );

		const { result } = renderHook(
			() => useReportPageTitles( [], reportOptions ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( titlesEndpoint );
		expect( result.current ).toEqual( {
			titles: undefined,
			loading: false,
		} );
	} );
} );
