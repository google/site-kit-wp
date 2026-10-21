/**
 * Traffic Overview `usePostsByPagePath` hook tests.
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
import { postsByPagePath } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, waitForDefaultTimeouts } from '@tests/js/utils';
import { usePostsByPagePath } from './usePostsByPagePath';

describe( 'usePostsByPagePath', () => {
	let registry: WPDataRegistry;

	const postsByPagePathEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/posts-by-page-path'
	);

	const travelTips = postsByPagePath[ '/?p=1' ];

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should be loading, with no posts and no error, while the posts load', async () => {
		freezeFetch( postsByPagePathEndpoint );

		const { result } = renderHook(
			() => usePostsByPagePath( [ '/?p=1' ] ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( result.current ).toEqual( {
			posts: undefined,
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should return the post of each page path, and should not be loading, once the posts load', async () => {
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: { '/?p=1': travelTips, '/?s=hats': null },
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePostsByPagePath( [ '/?p=1', '/?s=hats' ] ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			posts: { '/?p=1': travelTips, '/?s=hats': null },
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should be loading, and should not request the posts, while the page paths are `undefined`', async () => {
		fetchMock.get( postsByPagePathEndpoint, { body: {}, status: 200 } );

		const { result } = renderHook( () => usePostsByPagePath( undefined ), {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( result.current ).toEqual( {
			posts: undefined,
			loading: true,
			error: undefined,
		} );
		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
	} );

	it( 'should return no posts, and should not send a request, for an empty list of page paths', async () => {
		fetchMock.get( postsByPagePathEndpoint, { body: {}, status: 200 } );

		const { result, waitForRegistry } = renderHook(
			() => usePostsByPagePath( [] ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			posts: {},
			loading: false,
			error: undefined,
		} );
		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
	} );

	it( 'should return the error, with no posts, and should not be loading, once the request fails', async () => {
		const errorResponse = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => usePostsByPagePath( [ '/?p=1' ] ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toEqual( {
			posts: undefined,
			loading: false,
			error: errorResponse,
		} );
	} );
} );
