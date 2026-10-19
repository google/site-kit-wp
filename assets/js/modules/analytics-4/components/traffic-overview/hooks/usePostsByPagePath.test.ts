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
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, waitForDefaultTimeouts } from '@tests/js/utils';
import { usePostsByPagePath } from './usePostsByPagePath';

describe( 'usePostsByPagePath', () => {
	let registry: WPDataRegistry;

	const postsByPagePathEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/posts-by-page-path'
	);

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should return the post or `null` of each page path, and should not be loading, once the request succeeds', async () => {
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: {
				'/?p=1': {
					id: 1,
					postType: 'post',
					title: 'Hello world!',
					url: 'http://example.com/?p=1',
				},
				'/?s=hats': null,
			},
			status: 200,
		} );

		const pagePaths = [ '/?p=1', '/?s=hats' ];

		const { result, waitForRegistry } = renderHook(
			() => usePostsByPagePath( pagePaths ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			posts: {
				'/?p=1': {
					id: 1,
					postType: 'post',
					title: 'Hello world!',
					url: 'http://example.com/?p=1',
				},
				'/?s=hats': null,
			},
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should be loading, with no posts and no error, while the request has not finished', async () => {
		freezeFetch( postsByPagePathEndpoint );

		const pagePaths = [ '/?p=1' ];

		const { result } = renderHook( () => usePostsByPagePath( pagePaths ), {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( result.current ).toMatchObject( {
			posts: undefined,
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should return no posts, should not be loading, and should not send a request for an empty list', async () => {
		const pagePaths: string[] = [];

		const { result } = renderHook( () => usePostsByPagePath( pagePaths ), {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
		expect( result.current ).toMatchObject( {
			posts: {},
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should return the error, and should not be loading, once the request fails', async () => {
		fetchMock.getOnce( postsByPagePathEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const pagePaths = [ '/?p=1' ];

		const { result, waitForRegistry } = renderHook(
			() => usePostsByPagePath( pagePaths ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			posts: undefined,
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
	} );

	it( 'should be loading, and should not send a request, while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( postsByPagePathEndpoint, {
			body: { '/?p=1': null },
			status: 200,
		} );

		const pagePaths = [ '/?p=1' ];

		const { result } = renderHook( () => usePostsByPagePath( pagePaths ), {
			registry,
			inView: false,
		} );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsByPagePathEndpoint );
		expect( result.current ).toMatchObject( {
			posts: undefined,
			loading: true,
			error: undefined,
		} );
	} );
} );
