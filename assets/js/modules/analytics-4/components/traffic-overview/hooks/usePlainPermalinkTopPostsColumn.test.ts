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
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { plainPermalinkTopPosts } from '@/js/modules/analytics-4/datastore/__fixtures__';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import {
	createWaitForRegistry,
	freezeFetch,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { usePlainPermalinkTopPostsColumn } from './usePlainPermalinkTopPostsColumn';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

describe( 'usePlainPermalinkTopPostsColumn', () => {
	let registry: WPDataRegistry;

	const topPostsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/plain-permalink-top-posts'
	);

	// The hook also requests the channels report, so the calls of `get()` for
	// the posts are picked by their datapoint.
	function getTopPostsCalls() {
		return jest
			.mocked( get )
			.mock.calls.filter(
				( [ , , datapoint ] ) =>
					datapoint === 'plain-permalink-top-posts'
			);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		// The total of the channels report is the 120 visitors that every
		// share is a percentage of.
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report'
			),
			{
				body: createBreakdownReport(
					[
						[ 'Direct', 100 ],
						[ 'Referral', 20 ],
					],
					120
				),
				status: 200,
			}
		);
	} );

	afterEach( () => {
		jest.mocked( get ).mockClear();
	} );

	it( 'should request the three posts with the most visitors in the date range of the Recent activity tab', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
			status: 200,
		} );

		const { waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect(
			getQueryArgs( fetchMock.lastCall( topPostsEndpoint )?.[ 0 ] ?? '' )
		).toMatchObject( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
			limit: '3',
		} );
	} );

	it( 'should request the posts with a cache of five minutes', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
			status: 200,
		} );

		const { waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, topPostsEndpoint );
		expect( getTopPostsCalls()[ 0 ][ 4 ] ).toStrictEqual( {
			cacheTTL: 300,
		} );
	} );

	it( "should return a row for each post, with its title or path, its visitors, its share of the site's visitors and its link", async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
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
				value: '30',
				secondaryValue: '(25.0%)',
				url: 'http://example.com/?p=1',
			},
			{
				label: 'About',
				value: '20',
				secondaryValue: '(16.7%)',
				url: 'http://example.com/?page_id=2',
			},
			{
				label: '/?p=3',
				value: '10',
				secondaryValue: '(8.3%)',
				url: 'http://example.com/?p=3',
			},
		] );
	} );

	it( 'should be loading, with no rows and no error, while the request for the posts has not finished', async () => {
		freezeFetch( topPostsEndpoint );

		const { result } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		// The channels report answers meanwhile, which updates the hook.
		await act( async () => {
			await waitForDefaultTimeouts();
		} );

		expect( result.current ).toMatchObject( {
			rows: [],
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should be loading, and should not request the posts, while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
			status: 200,
		} );

		const { result } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( topPostsEndpoint );
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should return the error, with no rows, and should not be loading, once the request for the posts fails', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
	} );

	it( 'should request the posts again, with the same cache, when `retry` is called after the request fails', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );
		fetchMock.getOnce( topPostsEndpoint, {
			body: plainPermalinkTopPosts,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// Without the error here, the check of `error` after the retry would
		// prove nothing.
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );

		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, topPostsEndpoint );
		expect( getTopPostsCalls()[ 1 ][ 4 ] ).toStrictEqual( {
			cacheTTL: 300,
		} );
		expect( result.current ).toMatchObject( {
			loading: false,
			error: undefined,
		} );
		expect( result.current.rows.map( ( { label } ) => label ) ).toEqual( [
			'Travel tips',
			'About',
			'/?p=3',
		] );
	} );

	it( 'should return "No data to display: your posts haven’t received any visitors yet" as the zero message when the report has visitors but none on a single post', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: { rows: [], total: 57 },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			rows: [],
			zeroState:
				'No data to display: your posts haven’t received any visitors yet',
		} );
	} );

	it( 'should return no zero message when the report has no visitors', async () => {
		fetchMock.getOnce( topPostsEndpoint, {
			body: { rows: [], total: 0 },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePlainPermalinkTopPostsColumn(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [] );
		expect( result.current.zeroState ).toBeUndefined();
	} );
} );
