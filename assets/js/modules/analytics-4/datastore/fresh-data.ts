/**
 * `modules/analytics-4` data store: fresh data.
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
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	Registry,
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
// The built plugin's `googlesitekit-api` global has no `createCacheKey()`.
import { createCacheKey } from '@/js/googlesitekit/api';
import { getItem, setItem } from '@/js/googlesitekit/api/cache';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { ErrorObject } from '@/js/util/errors';
import {
	MODULES_ANALYTICS_4,
	POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS,
} from './constants';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

export interface RecentContentItem {
	/** The ID of the post or product. */
	id: number;
	/** The title as text, e.g. `Don’t miss it`, not `Don&#8217;t <em>miss</em> it`. */
	title: string;
	/** The URL of the post or product. */
	permalink: string;
	/** The path of `permalink`, e.g. `/hello-world/`, which matches the `pagePath` dimension of an Analytics report row. */
	pagePath: string;
	/** The publish time in UTC, in ISO 8601 format, e.g. `2026-09-24T14:05:00Z`. */
	publishedAt: string;
	/** The publish time in the site's time zone, as WordPress shows it, e.g. `2026-09-24T10:05:00`, with no time zone suffix. */
	sitePublishedAt: string;
}

export interface RecentContentOptions {
	/** The maximum number of posts and products to return. */
	count: number;
}

interface RecentContentParams extends RecentContentOptions {
	/** Whether to request products as well as posts. */
	includeProducts: boolean;
}

export type ExcludedProducts =
	| {
			/** The way to recognize a product page: by the path that every product URL starts with. */
			by: 'pathPrefix';
			/** The path that every product URL starts with, such as `/product/`, never a full URL. */
			pathPrefix: string;
	  }
	| {
			/** The way to recognize a product page: by the `googlesitekit_post_type` custom dimension. */
			by: 'postTypeDimension';
			/** The product post type, such as `product`, which is the custom dimension's value for a product page. */
			postType: string;
	  }
	| {
			/** The way to recognize a product page on plain permalinks: by its query string. */
			by: 'queryString';
			/** The product post type, such as `product`, which a URL can name as `post_type=product` with the product's ID. */
			postType: string;
			/** The query var of a product, such as `product` in `/?product=hoodie`, or `null` where the product post type has none. */
			queryVar: string | null;
	  };

/**
 * A published single post that a page path shows, as `GET:posts-by-page-path` returns it.
 *
 * @since n.e.x.t
 */
export interface PagePathPost {
	/** The ID of the post. */
	id: number;
	/** The title as text, such as `Don’t miss it`, or an empty string for a post with no title. */
	title: string;
	/** The URL of the post, such as `https://example.com/?p=123`. */
	url: string;
}

/**
 * The post each page path shows, keyed by the page path, such as `/?p=123`, with `null` where it shows no single published post.
 *
 * @since n.e.x.t
 */
export type PostsByPagePath = Record< string, PagePathPost | null >;

interface PostsByPagePathParams {
	/** The page paths to look up, such as `/?p=123`. */
	pagePaths: string[];
}

interface WordPressPost {
	/** The post ID. */
	id: number;
	/** The publish time in the site's time zone, e.g. `2026-09-24T10:05:00`, with no time zone suffix. */
	date: string;
	/** The publish time in UTC, e.g. `2026-09-24T14:05:00`, with no time zone suffix. */
	// eslint-disable-next-line camelcase -- The WordPress REST API returns this field as `date_gmt`.
	date_gmt: string;
	/** The post URL. */
	link: string;
	/** The post title. */
	title: {
		/** The title as HTML, e.g. `Don&#8217;t <em>miss</em> it`. */
		rendered: string;
	};
}

interface FreshDataState {
	/** The newest posts and products, saved under the `count` of the request. */
	recentContent: Record< number, RecentContentItem[] >;
	/** The post of each page path loaded so far. */
	postsByPagePath: PostsByPagePath;
}

const fetchGetRecentContentStore = createFetchStore( {
	baseName: 'getRecentContent',
	async controlCallback( {
		count,
		includeProducts,
	}: RecentContentParams ): Promise< RecentContentItem[] > {
		// `wp/v2/product` doesn't need a capability, but `wc/v3/products` needs
		// `read_private_products`, which not every view-only user has.
		const paths = includeProducts
			? [ '/wp/v2/posts', '/wp/v2/product' ]
			: [ '/wp/v2/posts' ];

		const responses = await Promise.all(
			paths.map( ( path ) =>
				apiFetch< WordPressPost[] >( {
					path: addQueryArgs( path, {
						status: 'publish',
						orderby: 'date',
						order: 'desc',
						per_page: count,
						_fields: 'id,date,date_gmt,link,title',
					} ),
				} )
			)
		);

		const parser = new DOMParser();

		return responses
			.flat()
			.map( ( post ) => ( {
				id: post.id,
				// `wptexturize()` writes an apostrophe as `&#8217;`, and an
				// author can add HTML tags, so we read the title's text.
				title: parser.parseFromString(
					post.title.rendered,
					'text/html'
				).body.textContent,
				permalink: post.link,
				pagePath: new URL( post.link ).pathname,
				publishedAt: `${ post.date_gmt }Z`,
				sitePublishedAt: post.date,
			} ) )
			.sort(
				( itemA, itemB ) =>
					Date.parse( itemB.publishedAt ) -
					Date.parse( itemA.publishedAt )
			)
			.slice( 0, count );
	},
	reducerCallback: createReducer(
		(
			state: FreshDataState,
			recentContent: RecentContentItem[],
			{ count }: RecentContentParams
		) => {
			state.recentContent[ count ] = recentContent;
		}
	),
	argsToParams: ( count: number, includeProducts: boolean ) => ( {
		count,
		includeProducts,
	} ),
	validateParams: ( { count = 0 }: Partial< RecentContentParams > ) => {
		invariant(
			Number.isInteger( count ) && count > 0,
			'count must be a positive integer.'
		);
	},
} ) as {
	actions: {
		fetchGetRecentContent: (
			count: number,
			includeProducts: boolean
		) => unknown;
	};
};

/**
 * Builds the key under which the API cache keeps the post of one page path.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePath The page path, such as `/?p=123`.
 * @return {string} The cache key.
 */
function getPostCacheKey( pagePath: string ): string {
	return createCacheKey(
		'modules',
		MODULE_SLUG_ANALYTICS_4,
		'posts-by-page-path',
		{ pagePath }
	);
}

const fetchGetPostsByPagePathStore = createFetchStore( {
	baseName: 'getPostsByPagePath',
	async controlCallback( {
		pagePaths,
	}: PostsByPagePathParams ): Promise< PostsByPagePath > {
		// The API cache keeps the post of each page path for an hour, so a
		// list with one new page path asks the server for that page path alone.
		const cachedPosts = await Promise.all(
			pagePaths.map( ( pagePath ) =>
				getItem( getPostCacheKey( pagePath ) )
			)
		);

		const posts: PostsByPagePath = {};
		const pagePathsToRequest: string[] = [];

		pagePaths.forEach( ( pagePath, index ) => {
			if ( cachedPosts[ index ].cacheHit ) {
				posts[ pagePath ] = cachedPosts[ index ].value;
			} else {
				pagePathsToRequest.push( pagePath );
			}
		} );

		if ( ! pagePathsToRequest.length ) {
			return posts;
		}

		// `get()` would cache the response under the whole list of page paths,
		// which a list with any other page path never reads.
		const response = ( await get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'posts-by-page-path',
			{ pagePaths: pagePathsToRequest },
			{ useCache: false }
		) ) as PostsByPagePath;

		// A page path the response leaves out gets `null`, because
		// `undefined` reads as not loaded and would keep the posts loading.
		pagePathsToRequest.forEach( ( pagePath ) => {
			posts[ pagePath ] = response[ pagePath ] ?? null;
		} );

		await Promise.all(
			pagePathsToRequest.map( ( pagePath ) =>
				setItem( getPostCacheKey( pagePath ), posts[ pagePath ] )
			)
		);

		return posts;
	},
	reducerCallback: createReducer(
		( state: FreshDataState, posts: PostsByPagePath ) => {
			Object.entries( posts ).forEach( ( [ pagePath, post ] ) => {
				state.postsByPagePath[ pagePath ] = post;
			} );
		}
	),
	argsToParams: ( pagePaths: string[] ) => ( { pagePaths } ),
	validateParams: ( { pagePaths }: Partial< PostsByPagePathParams > ) => {
		invariant(
			Array.isArray( pagePaths ) &&
				pagePaths.length <= POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS,
			`pagePaths must be a list of at most ${ POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS } page paths.`
		);
	},
} ) as {
	actions: {
		fetchGetPostsByPagePath: ( pagePaths: string[] ) => unknown;
	};
};

const baseInitialState: FreshDataState = {
	recentContent: {},
	postsByPagePath: {},
};

const baseResolvers = {
	*getRecentContent(
		options: RecentContentOptions
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		// `shouldIncludeWooCommerceProducts()` returns `undefined` until the
		// site info, the Analytics settings, and the module list have loaded.
		yield commonActions.await(
			Promise.all( [
				registry.resolveSelect( CORE_SITE ).getSiteInfo(),
				registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				registry.resolveSelect( CORE_MODULES ).getModules(),
			] )
		);

		// `shouldIncludeWooCommerceProducts()` stays `undefined` when the
		// Analytics settings request fails, so the list has posts only.
		const includeProducts = !! registry
			.select( MODULES_ANALYTICS_4 )
			.shouldIncludeWooCommerceProducts();

		// An earlier failed request saved its error under the selector's
		// arguments, `[ options ]`, where the fetch store doesn't clear it.
		yield clearSelectorError( 'getRecentContent', [ options ] );

		// We request the list even when the state already has one, so that
		// `invalidateResolution()` refreshes it.
		const { error } =
			( yield fetchGetRecentContentStore.actions.fetchGetRecentContent(
				options.count,
				includeProducts
			) ) as { error?: ErrorObject };

		// We move the error from the fetch store's arguments,
		// `[ count, includeProducts ]`, to the selector's, `[ options ]`, so a
		// component can read it and retry the request.
		if ( error ) {
			yield clearSelectorError( 'getRecentContent', [
				options.count,
				includeProducts,
			] );
			yield setErrorForSelector( error, 'getRecentContent', [ options ] );
		}
	},

	*getPostsByPagePath(
		pagePaths: string[]
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		// An earlier failed request saved its error under the selector's
		// arguments, `[ pagePaths ]`, where the fetch store doesn't clear it.
		yield clearSelectorError( 'getPostsByPagePath', [ pagePaths ] );

		const pagePathsToLoad = pagePaths.filter(
			( pagePath ) =>
				registry
					.select( MODULES_ANALYTICS_4 )
					.getPostByPagePath( pagePath ) === undefined
		);

		const { error } =
			( yield fetchGetPostsByPagePathStore.actions.fetchGetPostsByPagePath(
				pagePathsToLoad
			) ) as { error?: ErrorObject };

		// We move the error from the fetch store's arguments,
		// `[ pagePathsToLoad ]`, to the selector's, `[ pagePaths ]`, so a
		// component can read it and retry the request.
		if ( error ) {
			yield clearSelectorError( 'getPostsByPagePath', [
				pagePathsToLoad,
			] );
			yield setErrorForSelector( error, 'getPostsByPagePath', [
				pagePaths,
			] );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the most recently published posts, newest first.
	 *
	 * The list includes WooCommerce products when
	 * `shouldIncludeWooCommerceProducts()` returns `true`. Read a request error
	 * with `getErrorForSelector( 'getRecentContent', [ options ] )`.
	 *
	 * @since 1.190.0
	 *
	 * @param {Object} state         The data store's state.
	 * @param {Object} options       The options for the list.
	 * @param {number} options.count The maximum number of posts and products to return.
	 * @return {(Array.<Object>|undefined)} The posts and products, newest first, or `undefined` until a request with the same `count` succeeds.
	 */
	getRecentContent(
		state: FreshDataState,
		{ count }: RecentContentOptions
	): RecentContentItem[] | undefined {
		return state.recentContent[ count ];
	},

	/**
	 * Gets the post that each of a list of page paths shows.
	 *
	 * On plain permalinks, every post shares the path of the home page, so a
	 * page path keeps its query string, such as `/?p=123`. The resolver asks
	 * `GET:posts-by-page-path` only for the page paths that haven't loaded yet,
	 * and the API cache keeps the post of each page path for an hour. Read a
	 * request error with `getErrorForSelector( 'getPostsByPagePath', [ pagePaths ] )`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         state     The data store's state.
	 * @param {Array.<string>} pagePaths The page paths, at most `POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS`, such as `/?p=123`.
	 * @return {(Object|undefined)} The post of each page path, keyed by the page path, with `null` where the page path shows no single published post. Returns `undefined` until every page path has loaded.
	 */
	getPostsByPagePath(
		state: FreshDataState,
		pagePaths: string[]
	): PostsByPagePath | undefined {
		const posts: PostsByPagePath = {};

		for ( const pagePath of pagePaths ) {
			const post = state.postsByPagePath[ pagePath ];

			if ( post === undefined ) {
				return undefined;
			}

			posts[ pagePath ] = post;
		}

		return posts;
	},

	/**
	 * Gets the post that one page path shows, once `getPostsByPagePath()` has loaded it.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    The data store's state.
	 * @param {string} pagePath The page path, such as `/?p=123`.
	 * @return {(Object|null|undefined)} The post, or `null` where the page path shows no single published post. Returns `undefined` until the page path has loaded.
	 */
	getPostByPagePath(
		state: FreshDataState,
		pagePath: string
	): PagePathPost | null | undefined {
		return state.postsByPagePath[ pagePath ];
	},

	/**
	 * Determines whether WooCommerce products should be included alongside
	 * WordPress posts for "Fresh Data" cards/widgets.
	 *
	 * @since 1.190.0
	 *
	 * @return {(boolean|undefined)} `true` if WooCommerce products should be included, `false` if not. Returns `undefined` if not yet loaded.
	 */
	shouldIncludeWooCommerceProducts: createRegistrySelector(
		( select: Select ) => (): boolean | undefined => {
			if ( ! isFeatureEnabled( 'freshData' ) ) {
				return false;
			}

			const wooCommerceActive =
				select( CORE_SITE ).isWooCommerceActivated();
			const setting =
				select(
					MODULES_ANALYTICS_4
				).getFreshDataIncludesWooCommerceProducts();
			const analyticsConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			if (
				wooCommerceActive === undefined ||
				setting === undefined ||
				analyticsConnected === undefined
			) {
				return undefined;
			}

			return analyticsConnected && wooCommerceActive && setting === true;
		}
	),

	/**
	 * Gets the way the Recent activity tab recognizes the product pages that
	 * it hides from its list of posts.
	 *
	 * The tab hides products only while WooCommerce is active and the setting
	 * to include products is off. Without WooCommerce, the setting doesn't
	 * show, so the tab lists every page. The tab recognizes a product page:
	 *
	 * 1. On plain permalinks, by its query string, such as `/?product=hoodie`.
	 * 2. Otherwise by the path that every product URL starts with, such as
	 *    `/product/`.
	 * 3. When product URLs share no such path, by the `googlesitekit_post_type`
	 *    custom dimension, if the Analytics property has it.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Object|null|undefined)} The way to recognize a product page, or `null` when the tab lists products or can't recognize them. Returns `undefined` if not yet loaded.
	 */
	getExcludedProducts: createRegistrySelector(
		( select: Select ) => (): ExcludedProducts | null | undefined => {
			const shouldIncludeProducts =
				select(
					MODULES_ANALYTICS_4
				).shouldIncludeWooCommerceProducts();

			if ( shouldIncludeProducts === undefined ) {
				// `shouldIncludeWooCommerceProducts()` stays `undefined` when
				// the Analytics settings request fails, and the tab then lists
				// every page.
				const hasSettingFailedToLoad =
					select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getSettings'
					) &&
					select(
						MODULES_ANALYTICS_4
					).getFreshDataIncludesWooCommerceProducts() === undefined;

				return hasSettingFailedToLoad ? null : undefined;
			}

			const postType = select( CORE_SITE ).getProductPostType();

			if (
				shouldIncludeProducts ||
				! select( CORE_SITE ).isWooCommerceActivated() ||
				! postType
			) {
				return null;
			}

			if ( select( CORE_SITE ).isUsingPlainPermalinks() ) {
				return {
					by: 'queryString',
					postType,
					queryVar: select( CORE_SITE ).getProductQueryVar(),
				};
			}

			const pathPrefix = select( CORE_SITE ).getProductPathPrefix();

			if ( pathPrefix ) {
				return { by: 'pathPrefix', pathPrefix };
			}

			const hasPostTypeDimension = select(
				MODULES_ANALYTICS_4
			).hasCustomDimensions( 'googlesitekit_post_type' );

			// `hasCustomDimensions()` stays `undefined` when nobody has synced
			// the property's custom dimensions and the user can't sync them,
			// such as a view-only user.
			if ( hasPostTypeDimension === undefined ) {
				return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getAvailableCustomDimensions'
				)
					? null
					: undefined;
			}

			return hasPostTypeDimension
				? { by: 'postTypeDimension', postType }
				: null;
		}
	),
};

const store = combineStores(
	fetchGetRecentContentStore,
	fetchGetPostsByPagePathStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export default store;
