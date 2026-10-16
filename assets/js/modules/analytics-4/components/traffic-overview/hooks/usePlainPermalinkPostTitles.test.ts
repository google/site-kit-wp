/**
 * Traffic Overview `usePlainPermalinkPostTitles` hook tests.
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
import { usePlainPermalinkPostTitles } from './usePlainPermalinkPostTitles';

describe( 'usePlainPermalinkPostTitles', () => {
	let registry: WPDataRegistry;

	const postsEndpoint = new RegExp( '^/wp/v2/posts' );
	const pagesEndpoint = new RegExp( '^/wp/v2/pages' );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should return the title of each post and page by its plain permalink', async () => {
		fetchMock.getOnce( postsEndpoint, {
			body: [ { id: 12, title: { rendered: 'Autumn recipes' } } ],
			status: 200,
		} );
		fetchMock.getOnce( pagesEndpoint, {
			body: [ { id: 5, title: { rendered: 'About us' } } ],
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12', '/?page_id=5' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			titles: {
				'/?p=12': 'Autumn recipes',
				'/?page_id=5': 'About us',
			},
			loading: false,
		} );
	} );

	it( 'should request the title of a post from `/wp/v2/posts` and the title of a page from `/wp/v2/pages`', async () => {
		fetchMock.getOnce( postsEndpoint, {
			body: [ { id: 12, title: { rendered: 'Autumn recipes' } } ],
			status: 200,
		} );
		fetchMock.getOnce( pagesEndpoint, {
			body: [ { id: 5, title: { rendered: 'About us' } } ],
			status: 200,
		} );

		const { waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12', '/?page_id=5' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( postsEndpoint, {
			query: { 'include[0]': '12' },
		} );
		expect( fetchMock ).toHaveFetched( pagesEndpoint, {
			query: { 'include[0]': '5' },
		} );
	} );

	it( 'should request the titles once for the same posts in another order', async () => {
		fetchMock.getOnce( postsEndpoint, {
			body: [
				{ id: 5, title: { rendered: 'Spring recipes' } },
				{ id: 12, title: { rendered: 'Autumn recipes' } },
			],
			status: 200,
		} );

		const first = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12', '/?p=5' ],
					'http://example.com'
				),
			{ registry }
		);

		await first.waitForRegistry();

		const second = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=5', '/?p=12' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).toHaveFetchedTimes( 1, postsEndpoint );
		expect( second.result.current.titles ).toEqual( {
			'/?p=5': 'Spring recipes',
			'/?p=12': 'Autumn recipes',
		} );
	} );

	it( "should return no title for a post that WordPress doesn't return, such as a deleted post", async () => {
		fetchMock.getOnce( postsEndpoint, {
			body: [ { id: 12, title: { rendered: 'Autumn recipes' } } ],
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12', '/?p=99' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			titles: { '/?p=12': 'Autumn recipes' },
			loading: false,
		} );
	} );

	it( 'should return no titles, and should not be loading, when the request for the titles fails', async () => {
		fetchMock.getOnce( postsEndpoint, {
			body: {
				code: 'rest_forbidden',
				message: 'Sorry, you are not allowed to do that.',
				data: { status: 401 },
			},
			status: 401,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			titles: undefined,
			loading: false,
		} );
	} );

	it( 'should be loading while the titles load', async () => {
		freezeFetch( postsEndpoint );

		const { result } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12' ],
					'http://example.com'
				),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).toHaveFetched( postsEndpoint );
		expect( result.current ).toEqual( {
			titles: undefined,
			loading: true,
		} );
	} );

	it( 'should be loading, and should not request the titles, while the Traffic Overview widget is out of view', async () => {
		const { result } = renderHook(
			() =>
				usePlainPermalinkPostTitles(
					[ '/?p=12' ],
					'http://example.com'
				),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
		expect( result.current.loading ).toBe( true );
	} );

	it( 'should not request titles, and should not be loading, when there are no plain permalinks', async () => {
		const { result } = renderHook(
			() => usePlainPermalinkPostTitles( [], 'http://example.com' ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
		expect( fetchMock ).not.toHaveFetched( pagesEndpoint );
		expect( result.current ).toEqual( {
			titles: undefined,
			loading: false,
		} );
	} );
} );
