/**
 * Traffic Overview `usePlainPermalinkTopPostsColumn` hook tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createBreakdownReport,
	forDimensions,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { postsByPagePath } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { provideIncludeProductsState } from '@/js/modules/analytics-4/datastore/test-utils';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { usePlainPermalinkTopPostsColumn } from './usePlainPermalinkTopPostsColumn';

describe( 'usePlainPermalinkTopPostsColumn', () => {
	let registry: WPDataRegistry;

	const postsRequest = forDimensions( 'pagePathPlusQueryString' );
	const postsByPagePathEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/posts-by-page-path'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	const travelTips = postsByPagePath[ '/?p=1' ];
	const about = postsByPagePath[ '/?page_id=2' ];
	const packingList = postsByPagePath[ '/?p=3' ];

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		// Without WooCommerce, the report has no product filter.
		provideIncludeProductsState( registry, {
			wooCommerceActive: false,
			usingPlainPermalinks: true,
		} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( 'should return one row for each post, with its title, its link and its share of the total of the report, most views first', async () => {
		// `/?p=1&utm_source=newsletter` has the same page path as `/?p=1`.
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/?p=1', 40 ],
					[ '/?page_id=2', 30 ],
					[ '/?p=1&utm_source=newsletter', 20 ],
					[ '/?p=3', 5 ],
				],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: {
				'/?p=1': travelTips,
				'/?page_id=2': about,
				'/?p=3': packingList,
			},
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Travel tips',
				value: '60',
				secondaryValue: '(30.0%)',
				url: 'http://example.com/?p=1',
			},
			{
				label: 'About',
				value: '30',
				secondaryValue: '(15.0%)',
				url: 'http://example.com/?page_id=2',
			},
			{
				label: 'Packing list',
				value: '5',
				secondaryValue: '(2.5%)',
				url: 'http://example.com/?p=3',
			},
		] );
	} );

	it( 'should link the row of a post to the permalink of the post rather than to its page path', async () => {
		// A post of a custom post type has a permalink by its query var, such as
		// `/?book=dune`, which differs from the page path the report records.
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[ [ '/?post_type=book&p=5', 10 ] ],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: {
				'/?post_type=book&p=5': {
					id: 5,
					title: 'Dune',
					url: 'http://example.com/?book=dune',
				},
			},
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Dune',
				value: '10',
				secondaryValue: '(5.0%)',
				url: 'http://example.com/?book=dune',
			},
		] );
	} );

	it( 'should add up the views of the page paths that show one post into one row', async () => {
		// WordPress shows the second page of a post split into pages at
		// `/?p=1&page=2`.
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/?p=1', 40 ],
					[ '/?p=1&page=2', 20 ],
				],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/?p=1': travelTips, '/?p=1&page=2': travelTips },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Travel tips',
				value: '60',
				secondaryValue: '(30.0%)',
				url: 'http://example.com/?p=1',
			},
		] );
	} );

	it( 'should leave out the page paths that show no single published post', async () => {
		// The home page lists the latest posts, and `/?s=hats` is a search.
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/', 50 ],
					[ '/?s=hats', 25 ],
					[ '/?p=1', 10 ],
				],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/': null, '/?s=hats': null, '/?p=1': travelTips },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Travel tips',
				value: '10',
				secondaryValue: '(5.0%)',
				url: 'http://example.com/?p=1',
			},
		] );
	} );

	it( 'should label a post with no title with its page path with the most views', async () => {
		const untitledPost = {
			id: 12,
			title: '',
			url: 'http://example.com/?p=12',
		};

		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/?p=12', 10 ],
					[ '/?p=12&page=2', 5 ],
				],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/?p=12': untitledPost, '/?p=12&page=2': untitledPost },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: '/?p=12',
				value: '15',
				secondaryValue: '(7.5%)',
				url: 'http://example.com/?p=12',
			},
		] );
	} );

	it( 'should request the posts of the 50 page paths with the most views', async () => {
		// Each page path has one view less than the one before it, so
		// `/?p=51` has the fewest.
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				Array.from(
					{ length: 51 },
					( _value, index ): [ string, number ] => [
						`/?p=${ index + 1 }`,
						100 - index,
					]
				),
				5000
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, { body: {}, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		const pagePaths = getQueryArg(
			fetchMock.lastCall( postsByPagePathEndpoint )?.[ 0 ] ?? '',
			'pagePaths'
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, postsByPagePathEndpoint );
		expect( pagePaths ).toHaveLength( 50 );
		expect( pagePaths ).not.toContain( '/?p=51' );
	} );

	it( 'should return one row for each page path, each linking to its page, and no error, when the request for the posts fails', async () => {
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/?p=1', 40 ],
					[ '/?page_id=2', 30 ],
					[ '/?p=1&utm_source=newsletter', 20 ],
				],
				200
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current.rows ).toEqual( [
			{
				label: '/?p=1',
				value: '60',
				secondaryValue: '(30.0%)',
				url: 'http://example.com/?p=1',
			},
			{
				label: '/?page_id=2',
				value: '30',
				secondaryValue: '(15.0%)',
				url: 'http://example.com/?page_id=2',
			},
		] );
		expect( result.current.error ).toBeUndefined();
	} );

	it( 'should be loading, with no rows, while the posts load', async () => {
		fetchMock.get( postsRequest, {
			body: createBreakdownReport( [ [ '/?p=1', 40 ] ], 200 ),
			status: 200,
		} );
		freezeFetch( postsByPagePathEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( postsByPagePathEndpoint );
		expect( result.current ).toMatchObject( { rows: [], loading: true } );
	} );

	it( 'should return the error of the report, with no rows, and should not be loading, when the report fails', async () => {
		fetchMock.get( postsRequest, { body: errorResponse, status: 500 } );
		fetchMock.get( postsByPagePathEndpoint, { body: {}, status: 200 } );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			error: errorResponse,
		} );
		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
	} );

	it( 'should be loading, with no rows, and should request neither the report nor the posts, while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( postsRequest, {
			body: createBreakdownReport( [ [ '/?p=1', 40 ] ], 200 ),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/?p=1': travelTips },
			status: 200,
		} );

		const { result } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsRequest );
		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: true,
			zeroState: undefined,
		} );
	} );

	it( 'should be loading, and should not request a report, while the setting to include products loads', async () => {
		// The registry from `beforeEach()` has the Analytics settings, so this
		// test builds one without them.
		registry = createTestRegistry();
		provideSiteInfo( registry, {
			wooCommerceActive: true,
			usingPlainPermalinks: true,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		freezeFetch( settingsEndpoint );
		fetchMock.get( postsRequest, {
			body: createBreakdownReport( [ [ '/?p=1', 40 ] ], 200 ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry, features: [ 'freshData' ] }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
		expect( result.current ).toMatchObject( { rows: [], loading: true } );
		expect( fetchMock ).not.toHaveFetched( postsRequest );
	} );

	it( 'should return no zero state message, so the column shows its default message, when the report has no views', async () => {
		fetchMock.get( postsRequest, {
			body: createBreakdownReport( [], 0 ),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, { body: {}, status: 200 } );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			zeroState: undefined,
		} );
	} );

	it( 'should return "No data to display: your posts haven’t received any visitors yet" as the zero state message when the report has views but none on a single post', async () => {
		fetchMock.get( postsRequest, {
			body: createBreakdownReport(
				[
					[ '/', 50 ],
					[ '/?s=hats', 25 ],
				],
				75
			),
			status: 200,
		} );
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/': null, '/?s=hats': null },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			zeroState: expect.stringMatching(
				/your posts haven’t received any visitors yet/
			),
		} );
	} );
} );
