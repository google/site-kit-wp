/**
 * `modules/analytics-4` data store: fresh data tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	setEnabledFeatures,
	untilResolved,
} from '@tests/js/test-utils';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from './constants';

const analytics4SettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const postsEndpoint = new RegExp( '^/wp/v2/posts' );
const productsEndpoint = new RegExp( '^/wp/v2/product' );

describe( 'modules/analytics-4 fresh data', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'shouldIncludeWooCommerceProducts', () => {
		function receiveState( {
			analyticsConnected = true,
			wooCommerceActive = true,
			setting = true,
		}: {
			analyticsConnected?: boolean;
			wooCommerceActive?: boolean;
			setting?: boolean;
		} = {} ) {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: analyticsConnected,
				},
			] );

			provideSiteInfo( registry, { wooCommerceActive } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: setting,
			} );
		}

		it( 'should return true when the flag is enabled, Analytics is connected, WooCommerce is active, and the setting is on', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState();

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( true );
		} );

		it( 'should return false when the freshData flag is disabled', () => {
			receiveState();

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when Analytics is not connected', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { analyticsConnected: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when WooCommerce is installed but not active', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { wooCommerceActive: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when the setting is off', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { setting: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return undefined while WooCommerce activation status is unresolved', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBeUndefined();
		} );

		it( 'should return undefined while the setting is unresolved', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: { [ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true },
				status: 200,
			} );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBeUndefined();

			await untilResolved( registry, MODULES_ANALYTICS_4 ).getSettings();
		} );
	} );

	describe( 'getRecentContent', () => {
		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );
		} );

		it( 'should return the most recently published posts, newest first', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
					{
						id: 9,
						date_gmt: '2026-09-21T08:30:00',
						link: 'http://example.com/summer-recap/',
						title: { rendered: 'Summer recap' },
					},
				],
				status: 200,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 2 } )
			).toBeUndefined();

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 2 } );

			expect( fetchMock ).toHaveFetched( postsEndpoint, {
				query: {
					status: 'publish',
					orderby: 'date',
					order: 'desc',
					per_page: '2',
				},
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 2 } )
			).toEqual( [
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
				{
					id: 9,
					title: 'Summer recap',
					permalink: 'http://example.com/summer-recap/',
					pagePath: '/summer-recap/',
					publishedAt: '2026-09-21T08:30:00Z',
				},
			] );
		} );

		it( 'should return an empty list when the site has no published posts', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, { body: [], status: 200 } );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [] );
		} );

		it( 'should merge products into the list by publish time when the "Include products in Recent activity" setting is on', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
					{
						id: 4,
						date_gmt: '2026-09-20T11:00:00',
						link: 'http://example.com/store-opening/',
						title: { rendered: 'Store opening' },
					},
				],
				status: 200,
			} );
			fetchMock.getOnce( productsEndpoint, {
				body: [
					{
						id: 31,
						date_gmt: '2026-09-25T10:15:00',
						link: 'http://example.com/product/ceramic-mug/',
						title: { rendered: 'Ceramic mug' },
					},
					{
						id: 27,
						date_gmt: '2026-09-22T16:40:00',
						link: 'http://example.com/product/tea-cup/',
						title: { rendered: 'Tea cup' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 3 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 3 } );

			expect( fetchMock ).toHaveFetched( productsEndpoint, {
				query: {
					status: 'publish',
					orderby: 'date',
					order: 'desc',
					per_page: '3',
				},
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 3 } )
			).toEqual( [
				{
					id: 31,
					title: 'Ceramic mug',
					permalink: 'http://example.com/product/ceramic-mug/',
					pagePath: '/product/ceramic-mug/',
					publishedAt: '2026-09-25T10:15:00Z',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
				{
					id: 27,
					title: 'Tea cup',
					permalink: 'http://example.com/product/tea-cup/',
					pagePath: '/product/tea-cup/',
					publishedAt: '2026-09-22T16:40:00Z',
				},
			] );
		} );

		it( 'should not request products when the "Include products in Recent activity" setting is off', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: false,
			} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect( fetchMock ).toHaveFetched( postsEndpoint );
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
			] );
		} );

		it( 'should include products when the Analytics settings load after the list is requested', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: { [ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true },
				status: 200,
			} );
			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );
			fetchMock.getOnce( productsEndpoint, {
				body: [
					{
						id: 31,
						date_gmt: '2026-09-25T10:15:00',
						link: 'http://example.com/product/ceramic-mug/',
						title: { rendered: 'Ceramic mug' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 31,
					title: 'Ceramic mug',
					permalink: 'http://example.com/product/ceramic-mug/',
					pagePath: '/product/ceramic-mug/',
					publishedAt: '2026-09-25T10:15:00Z',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
			] );
		} );

		it( 'should return posts only when the Analytics settings fail to load', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );
			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect( console ).toHaveErrored();
			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect( fetchMock ).toHaveFetched( postsEndpoint );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
			] );
		} );

		it( 'should return the title with its HTML entities decoded and the path of the permalink', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 5,
						date_gmt: '2026-09-23T17:45:00',
						link: 'http://example.com/blog/2026/09/coffee-and-cake/',
						title: {
							rendered: 'Coffee &#038; cake we&#8217;ve baked',
						},
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 5,
					title: 'Coffee & cake we’ve baked',
					permalink:
						'http://example.com/blog/2026/09/coffee-and-cake/',
					pagePath: '/blog/2026/09/coffee-and-cake/',
					publishedAt: '2026-09-23T17:45:00Z',
				},
			] );
		} );

		it( 'should return `undefined` and store the error for `getErrorForSelector()` when the posts request fails', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			const error = registry
				.select( MODULES_ANALYTICS_4 )
				.getErrorForSelector( 'getRecentContent', [ { count: 10 } ] );

			expect( error ).toEqual( {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getSelectorDataForError( error )
			).toEqual( {
				storeName: 'modules/analytics-4',
				name: 'getRecentContent',
				args: [ { count: 10 } ],
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toBeUndefined();
		} );

		it( 'should return `undefined` and store the error for `getErrorForSelector()` when the products request fails', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );
			fetchMock.getOnce( productsEndpoint, {
				body: {
					code: 'rest_no_route',
					message:
						'No route was found matching the URL and request method.',
					data: { status: 404 },
				},
				status: 404,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			const error = registry
				.select( MODULES_ANALYTICS_4 )
				.getErrorForSelector( 'getRecentContent', [ { count: 10 } ] );

			expect( error ).toEqual( {
				code: 'rest_no_route',
				message:
					'No route was found matching the URL and request method.',
				data: { status: 404 },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getSelectorDataForError( error )
			).toEqual( {
				storeName: 'modules/analytics-4',
				name: 'getRecentContent',
				args: [ { count: 10 } ],
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toBeUndefined();
		} );

		it( 'should remove the error from `getErrorForSelector()` when a retry of the list succeeds', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getRecentContent', [
						{ count: 10 },
					] )
			).toEqual( {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getRecentContent', [ { count: 10 } ] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getRecentContent', [
						{ count: 10 },
					] )
			).toBeUndefined();
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
			] );
		} );

		it( 'should include a post published after the first request when the list loads again', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 15,
						date_gmt: '2026-09-26T07:20:00',
						link: 'http://example.com/first-frost/',
						title: { rendered: 'First frost' },
					},
					{
						id: 12,
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getRecentContent', [ { count: 10 } ] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect( fetchMock ).toHaveFetchedTimes( 2, postsEndpoint );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toEqual( [
				{
					id: 15,
					title: 'First frost',
					permalink: 'http://example.com/first-frost/',
					pagePath: '/first-frost/',
					publishedAt: '2026-09-26T07:20:00Z',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
				},
			] );
		} );

		it( 'should ask the browser not to use a cached response', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			fetchMock.getOnce( postsEndpoint, { body: [], status: 200 } );
			fetchMock.getOnce( productsEndpoint, { body: [], status: 200 } );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 10 } );

			expect( fetchMock.lastCall( postsEndpoint )?.[ 1 ]?.cache ).toBe(
				'no-store'
			);
			expect( fetchMock.lastCall( productsEndpoint )?.[ 1 ]?.cache ).toBe(
				'no-store'
			);
		} );

		it( 'should reject a count of 0', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 0 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 0 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getResolutionError( 'getRecentContent', [ { count: 0 } ] )
			).toEqual( new Error( 'count must be a positive integer.' ) );
			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );
	} );
} );
