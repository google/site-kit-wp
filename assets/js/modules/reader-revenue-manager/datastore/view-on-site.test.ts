/**
 * `modules/reader-revenue-manager` data store: view on site URL tests.
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideSiteInfo,
	untilResolved,
} from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager view on site URL', () => {
	let registry: WPDataRegistry;

	const searchEndpoint = new RegExp( '^/wp/v2/search' );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getFirstPublicPostURL', () => {
			it( 'should return undefined when no post types are provided', () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getFirstPublicPostURL( [] )
				).toBeUndefined();
			} );

			it( 'should fetch the first matching post URL when not loaded', async () => {
				fetchMock.getOnce( searchEndpoint, {
					body: [ { url: 'http://example.com/hello-world/' } ],
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getFirstPublicPostURL( [ 'post' ] )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getFirstPublicPostURL( [ 'post' ] );

				expect( fetchMock ).toHaveFetched( searchEndpoint );
				expect( fetchMock.lastCall( searchEndpoint )?.[ 0 ] ).toContain(
					'subtype=post'
				);
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getFirstPublicPostURL( [ 'post' ] )
				).toBe( 'http://example.com/hello-world/' );
			} );

			it( 'should resolve to undefined when there is no matching post', async () => {
				fetchMock.getOnce( searchEndpoint, {
					body: [],
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getFirstPublicPostURL( [ 'post' ] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getFirstPublicPostURL( [ 'post' ] );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getFirstPublicPostURL( [ 'post' ] )
				).toBeUndefined();
			} );

			it( 'should key results by post types regardless of order', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetFirstPublicPostURL(
						'http://example.com/hello-world/',
						{ postTypes: [ 'post', 'page' ] }
					);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getFirstPublicPostURL( [ 'page', 'post' ] )
				).toBe( 'http://example.com/hello-world/' );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getFirstPublicPostURL( [ 'page', 'post' ] );

				expect( fetchMock ).not.toHaveFetched( searchEndpoint );
			} );
		} );

		describe( 'getViewOnSiteURL', () => {
			it( 'should return the home URL for the sitewide snippet mode', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( { snippetMode: 'sitewide' } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getViewOnSiteURL()
				).toBe( 'http://example.com' );
			} );

			it( 'should return undefined for an unsupported snippet mode', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( { snippetMode: 'per_post' } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getViewOnSiteURL()
				).toBeUndefined();
			} );

			it( 'should return undefined when the post_types snippet mode has no post types configured', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						snippetMode: 'post_types',
						postTypes: [],
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getViewOnSiteURL()
				).toBeUndefined();
			} );

			it( 'should resolve the first matching post URL for the post_types snippet mode', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						snippetMode: 'post_types',
						postTypes: [ 'post' ],
					} );

				fetchMock.getOnce( searchEndpoint, {
					body: [ { url: 'http://example.com/hello-world/' } ],
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getViewOnSiteURL()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getFirstPublicPostURL( [ 'post' ] );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getViewOnSiteURL()
				).toBe( 'http://example.com/hello-world/' );
			} );
		} );
	} );
} );
