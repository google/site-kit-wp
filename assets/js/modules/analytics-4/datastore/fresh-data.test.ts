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
import { getQueryArg, getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	setEnabledFeatures,
	untilResolved,
	waitFor,
} from '@tests/js/test-utils';
import { plainPermalinkTopPosts } from './__fixtures__';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from './constants';
import { provideIncludeProductsState } from './test-utils';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

const analytics4SettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const postsEndpoint = new RegExp( '^/wp/v2/posts' );
/** The `/wp/v2/product` route up to its `?`, so that `/wp/v2/products` doesn't match. */
const productsEndpoint = new RegExp( '^/wp/v2/product\\?' );
/** The route of the `plain-permalink-top-posts` datapoint, with any query string after it. */
const plainPermalinkTopPostsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/plain-permalink-top-posts'
);

describe( 'modules/analytics-4 fresh data', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		jest.mocked( get ).mockClear();
	} );

	describe( 'shouldIncludeWooCommerceProducts', () => {
		it( 'should return true when the flag is enabled, Analytics is connected, WooCommerce is active, and the setting is on', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( true );
		} );

		it( 'should return false when the freshData flag is disabled', () => {
			provideIncludeProductsState( registry );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when Analytics is not connected', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				analyticsConnected: false,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when WooCommerce is installed but not active', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				wooCommerceActive: false,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when the setting is off', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, { setting: false } );

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

	describe( 'getExcludedProducts', () => {
		it( 'should return the path that every product URL starts with when the setting to include products is off', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				setting: false,
				productPathPrefix: '/product/',
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toEqual( { by: 'pathPrefix', pathPrefix: '/product/' } );
		} );

		it( 'should return the product post type for the `googlesitekit_post_type` custom dimension when product URLs share no path and the Analytics property has the dimension', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				setting: false,
				productPathPrefix: null,
				availableCustomDimensions: [ 'googlesitekit_post_type' ],
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toEqual( { by: 'postTypeDimension', postType: 'product' } );
		} );

		it( "should return null when product URLs share no path and the Analytics property doesn't have the `googlesitekit_post_type` custom dimension", () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				setting: false,
				productPathPrefix: null,
				availableCustomDimensions: [ 'googlesitekit_post_author' ],
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( "should return null when product URLs share no path and the user can't sync the unknown custom dimensions of the Analytics property", async () => {
			setEnabledFeatures( [ 'freshData' ] );

			// A user who hasn't signed in with Google, such as a view-only user,
			// can't sync the custom dimensions.
			provideUserAuthentication( registry, { authenticated: false } );
			provideIncludeProductsState( registry, {
				setting: false,
				productPathPrefix: null,
				availableCustomDimensions: null,
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeUndefined();

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getAvailableCustomDimensions();

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( 'should return undefined while the custom dimensions of the Analytics property sync', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideUserAuthentication( registry );
			provideUserCapabilities( registry );
			provideIncludeProductsState( registry, {
				setting: false,
				productPathPrefix: null,
				availableCustomDimensions: null,
			} );
			freezeFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
				)
			);

			registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts();

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
					)
				)
			);

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeUndefined();
		} );

		it( 'should return null when the setting to include products is on', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				setting: true,
				productPathPrefix: '/product/',
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( 'should return null when WooCommerce is not active, even when the setting to include products is off and product URLs share a path', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				wooCommerceActive: false,
				setting: false,
				productPathPrefix: '/product/',
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( 'should return null when the site has no product post type, even when the setting to include products is off', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideIncludeProductsState( registry, {
				setting: false,
				productPostType: null,
				productPathPrefix: '/product/',
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( 'should return undefined while the setting to include products loads', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: { [ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: false },
				status: 200,
			} );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			provideSiteInfo( registry, {
				wooCommerceActive: true,
				productPathPrefix: '/product/',
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeUndefined();

			await untilResolved( registry, MODULES_ANALYTICS_4 ).getSettings();
		} );

		it( 'should return null when the Analytics settings request fails', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			provideSiteInfo( registry, {
				wooCommerceActive: true,
				productPathPrefix: '/product/',
			} );

			registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts();

			await untilResolved( registry, MODULES_ANALYTICS_4 ).getSettings();

			expect( console ).toHaveErrored();
			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeNull();
		} );

		it( 'should return undefined while the module list loads, after the setting to include products has loaded', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			freezeFetch(
				new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
			);

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: false,
			} );

			provideSiteInfo( registry, {
				wooCommerceActive: true,
				productPathPrefix: '/product/',
			} );

			registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts();

			await untilResolved( registry, MODULES_ANALYTICS_4 ).getSettings();

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getExcludedProducts()
			).toBeUndefined();
		} );
	} );

	describe( 'getRecentContent', () => {
		const baseData = global._googlesitekitBaseData;

		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );
		} );

		afterEach( () => {
			global._googlesitekitBaseData = baseData;
		} );

		it( 'should return the most recently published posts, newest first', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
					{
						id: 9,
						date: '2026-09-21T04:30:00',
						date_gmt: '2026-09-21T08:30:00',
						link: 'http://example.com/summer-recap/',
						title: { rendered: 'Summer recap' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 2 } );

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
					_fields: 'id,date,date_gmt,link,title',
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
					sitePublishedAt: '2026-09-24T10:05:00',
				},
				{
					id: 9,
					title: 'Summer recap',
					permalink: 'http://example.com/summer-recap/',
					pagePath: '/summer-recap/',
					publishedAt: '2026-09-21T08:30:00Z',
					sitePublishedAt: '2026-09-21T04:30:00',
				},
			] );
		} );

		it( 'should return `undefined` while the posts load', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			freezeFetch( postsEndpoint );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 10 } );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( postsEndpoint )
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 10 } )
			).toBeUndefined();
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

		it( 'should return a separate list for each `count`', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 1 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 1 } );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
					{
						id: 9,
						date: '2026-09-21T04:30:00',
						date_gmt: '2026-09-21T08:30:00',
						link: 'http://example.com/summer-recap/',
						title: { rendered: 'Summer recap' },
					},
				],
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 2 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 2 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getRecentContent( { count: 1 } )
			).toEqual( [
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
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
					sitePublishedAt: '2026-09-24T10:05:00',
				},
				{
					id: 9,
					title: 'Summer recap',
					permalink: 'http://example.com/summer-recap/',
					pagePath: '/summer-recap/',
					publishedAt: '2026-09-21T08:30:00Z',
					sitePublishedAt: '2026-09-21T04:30:00',
				},
			] );
		} );

		it( 'should return posts and products together, newest first, when the "Include products in Recent activity" setting is on', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
						date_gmt: '2026-09-24T14:05:00',
						link: 'http://example.com/autumn-recipes/',
						title: { rendered: 'Autumn recipes' },
					},
					{
						id: 4,
						date: '2026-09-20T07:00:00',
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
						date: '2026-09-25T06:15:00',
						date_gmt: '2026-09-25T10:15:00',
						link: 'http://example.com/product/ceramic-mug/',
						title: { rendered: 'Ceramic mug' },
					},
					{
						id: 27,
						date: '2026-09-22T12:40:00',
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
					_fields: 'id,date,date_gmt,link,title',
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
					sitePublishedAt: '2026-09-25T06:15:00',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
					sitePublishedAt: '2026-09-24T10:05:00',
				},
				{
					id: 27,
					title: 'Tea cup',
					permalink: 'http://example.com/product/tea-cup/',
					pagePath: '/product/tea-cup/',
					publishedAt: '2026-09-22T16:40:00Z',
					sitePublishedAt: '2026-09-22T12:40:00',
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
						date: '2026-09-24T10:05:00',
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
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
		} );

		it( 'should include products when the site info, the Analytics settings, and the module list load after `getRecentContent()` is called', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			// The site info loads from `_googlesitekitBaseData`.
			global._googlesitekitBaseData = {
				...baseData,
				wooCommerceActive: true,
			};

			// The registry from `beforeEach()` already has the module list.
			registry = createTestRegistry();

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: { [ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true },
				status: 200,
			} );
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
				{
					body: [
						{
							slug: MODULE_SLUG_ANALYTICS_4,
							active: true,
							connected: true,
						},
					],
					status: 200,
				}
			);
			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
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
						date: '2026-09-25T06:15:00',
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
					sitePublishedAt: '2026-09-25T06:15:00',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
		} );

		it( 'should return posts and omit products when the Analytics settings fail to load', async () => {
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
						date: '2026-09-24T10:05:00',
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
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
		} );

		it( 'should return the title with its HTML entities decoded and its HTML tags removed', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 5,
						date: '2026-09-23T13:45:00',
						date_gmt: '2026-09-23T17:45:00',
						link: 'http://example.com/blog/2026/09/coffee-and-cake/',
						title: {
							rendered:
								'Coffee &#038; <em>cake</em> we&#8217;ve baked&hellip;',
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
					title: 'Coffee & cake we’ve baked…',
					permalink:
						'http://example.com/blog/2026/09/coffee-and-cake/',
					pagePath: '/blog/2026/09/coffee-and-cake/',
					publishedAt: '2026-09-23T17:45:00Z',
					sitePublishedAt: '2026-09-23T13:45:00',
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
						date: '2026-09-24T10:05:00',
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

		it( 'should remove the error from `getErrorForSelector()` when a retry of the posts request succeeds', async () => {
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
						date: '2026-09-24T10:05:00',
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
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
		} );

		it( 'should include a post published after the first request when the posts are requested again', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			fetchMock.getOnce( postsEndpoint, {
				body: [
					{
						id: 12,
						date: '2026-09-24T10:05:00',
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
						date: '2026-09-26T03:20:00',
						date_gmt: '2026-09-26T07:20:00',
						link: 'http://example.com/first-frost/',
						title: { rendered: 'First frost' },
					},
					{
						id: 12,
						date: '2026-09-24T10:05:00',
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
					sitePublishedAt: '2026-09-26T03:20:00',
				},
				{
					id: 12,
					title: 'Autumn recipes',
					permalink: 'http://example.com/autumn-recipes/',
					pagePath: '/autumn-recipes/',
					publishedAt: '2026-09-24T14:05:00Z',
					sitePublishedAt: '2026-09-24T10:05:00',
				},
			] );
		} );

		it( 'should store the "count must be a positive integer." error for `getResolutionError()` and not request posts when `count` is `0`', async () => {
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

		it( 'should store the "count must be a positive integer." error for `getResolutionError()` and not request posts when `count` is `2.5`', async () => {
			provideSiteInfo( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getRecentContent( { count: 2.5 } );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getRecentContent( { count: 2.5 } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getResolutionError( 'getRecentContent', [
						{ count: 2.5 },
					] )
			).toEqual( new Error( 'count must be a positive integer.' ) );
			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );
	} );

	describe( 'getPlainPermalinkTopPosts', () => {
		it( 'should return the posts with the most visitors and the total of the report for the dates and the limit of the options', async () => {
			fetchMock.getOnce( plainPermalinkTopPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 3,
			} );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 3,
			} );

			expect(
				getQueryArgs(
					fetchMock.lastCall(
						plainPermalinkTopPostsEndpoint
					)?.[ 0 ] ?? ''
				)
			).toMatchObject( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: '3',
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-21',
						endDate: '2026-10-22',
						limit: 3,
					} )
			).toEqual( plainPermalinkTopPosts );
		} );

		it( 'should return `undefined` while the posts load', async () => {
			freezeFetch( plainPermalinkTopPostsEndpoint );

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 3,
			} );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					plainPermalinkTopPostsEndpoint
				)
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-21',
						endDate: '2026-10-22',
						limit: 3,
					} )
			).toBeUndefined();
		} );

		it( 'should request the posts with the fetch options, such as a cache of five minutes', async () => {
			fetchMock.getOnce( plainPermalinkTopPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			expect( get ).toHaveBeenCalledTimes( 1 );
			expect( get ).toHaveBeenCalledWith(
				'modules',
				'analytics-4',
				'plain-permalink-top-posts',
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);
		} );

		it( 'should keep the posts of each set of options apart', async () => {
			fetchMock.getOnce(
				( url ) =>
					plainPermalinkTopPostsEndpoint.test( url ) &&
					getQueryArg( url, 'limit' ) === '2',
				{
					body: {
						rows: plainPermalinkTopPosts.rows.slice( 0, 2 ),
						total: 100,
					},
					status: 200,
				}
			);
			fetchMock.getOnce(
				( url ) =>
					plainPermalinkTopPostsEndpoint.test( url ) &&
					getQueryArg( url, 'startDate' ) === '2026-10-20',
				{ body: { ...plainPermalinkTopPosts, total: 150 }, status: 200 }
			);
			fetchMock.getOnce(
				( url ) =>
					plainPermalinkTopPostsEndpoint.test( url ) &&
					getQueryArg( url, 'endDate' ) === '2026-10-23',
				{ body: { ...plainPermalinkTopPosts, total: 120 }, status: 200 }
			);
			fetchMock.getOnce(
				( url ) =>
					plainPermalinkTopPostsEndpoint.test( url ) &&
					getQueryArg( url, 'startDate' ) === '2026-10-21' &&
					getQueryArg( url, 'endDate' ) === '2026-10-22' &&
					getQueryArg( url, 'limit' ) === '3',
				{ body: plainPermalinkTopPosts, status: 200 }
			);

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 2,
			} );
			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-20',
				endDate: '2026-10-22',
				limit: 3,
			} );
			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-23',
				limit: 3,
			} );
			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 3,
			} );

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 2,
			} );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts( {
				startDate: '2026-10-20',
				endDate: '2026-10-22',
				limit: 3,
			} );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-23',
				limit: 3,
			} );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts( {
				startDate: '2026-10-21',
				endDate: '2026-10-22',
				limit: 3,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-21',
						endDate: '2026-10-22',
						limit: 2,
					} )
			).toEqual( {
				rows: plainPermalinkTopPosts.rows.slice( 0, 2 ),
				total: 100,
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-20',
						endDate: '2026-10-22',
						limit: 3,
					} )
			).toEqual( { ...plainPermalinkTopPosts, total: 150 } );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-21',
						endDate: '2026-10-23',
						limit: 3,
					} )
			).toEqual( { ...plainPermalinkTopPosts, total: 120 } );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts( {
						startDate: '2026-10-21',
						endDate: '2026-10-22',
						limit: 3,
					} )
			).toEqual( plainPermalinkTopPosts );
		} );

		it( 'should return `undefined` and store the error for `getErrorForSelector()` under the options when the request fails', async () => {
			fetchMock.getOnce( plainPermalinkTopPostsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			expect( console ).toHaveErrored();
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getPlainPermalinkTopPosts', [
						{
							startDate: '2026-10-21',
							endDate: '2026-10-22',
							limit: 3,
						},
					] )
			).toEqual( {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts(
						{
							startDate: '2026-10-21',
							endDate: '2026-10-22',
							limit: 3,
						},
						{ cacheTTL: 300 }
					)
			).toBeUndefined();
		} );

		it( 'should request the posts again, and remove the error from `getErrorForSelector()`, when the resolution is invalidated after a failed request', async () => {
			fetchMock.getOnce( plainPermalinkTopPostsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );
			fetchMock.getOnce( plainPermalinkTopPostsEndpoint, {
				body: plainPermalinkTopPosts,
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			expect( console ).toHaveErrored();

			// Without the saved error here, the check of the error after the
			// retry would prove nothing.
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getPlainPermalinkTopPosts', [
						{
							startDate: '2026-10-21',
							endDate: '2026-10-22',
							limit: 3,
						},
					] )
			).toEqual( {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getPlainPermalinkTopPosts', [
					{
						startDate: '2026-10-21',
						endDate: '2026-10-22',
						limit: 3,
					},
					{ cacheTTL: 300 },
				] );
			registry.select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getPlainPermalinkTopPosts(
				{
					startDate: '2026-10-21',
					endDate: '2026-10-22',
					limit: 3,
				},
				{ cacheTTL: 300 }
			);

			expect( fetchMock ).toHaveFetchedTimes(
				2,
				plainPermalinkTopPostsEndpoint
			);
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getPlainPermalinkTopPosts', [
						{
							startDate: '2026-10-21',
							endDate: '2026-10-22',
							limit: 3,
						},
					] )
			).toBeUndefined();
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPlainPermalinkTopPosts(
						{
							startDate: '2026-10-21',
							endDate: '2026-10-22',
							limit: 3,
						},
						{ cacheTTL: 300 }
					)
			).toEqual( plainPermalinkTopPosts );
		} );
	} );
} );
