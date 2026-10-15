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
import {
	Registry,
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { stringifyObject } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import { MODULES_ANALYTICS_4 } from './constants';

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
}

interface RecentContentOptions {
	/** The maximum number of posts and products to return. */
	count: number;
}

interface RecentContentParams extends RecentContentOptions {
	/** Whether to request products as well as posts. */
	includeProducts: boolean;
}

export interface PostTitlesOptions {
	/** The IDs of the posts, of the `post` post type. */
	postIDs: number[];
	/** The IDs of the pages. */
	pageIDs: number[];
}

export type ExcludedProducts =
	| {
			/** The way to recognize a product page: by the path that every product URL starts with. */
			by: 'pathPrefix';
			/** The path that every product URL starts with, such as `/product/`, never a full URL. */
			pathPrefix: string;
	  }
	| {
			/** The way to recognize a product page on plain permalinks: by the query string of its URL. */
			by: 'queryVar';
			/** The product post type, such as `product`, which a product URL can name in `post_type=product`. */
			postType: string;
			/** The query var that holds the slug of a product, such as `product` in `/?product=hoodie`, or `null` when WordPress reads none. */
			queryVar: string | null;
	  }
	| {
			/** The way to recognize a product page: by the `googlesitekit_post_type` custom dimension. */
			by: 'postTypeDimension';
			/** The product post type, such as `product`, which the custom dimension holds for a product page. */
			postType: string;
	  };

interface WordPressPost {
	/** The post ID. */
	id: number;
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
	/** The title of each post and page by its ID, saved under the hash of the `PostTitlesOptions` of the request. */
	postTitles: Record< string, Record< number, string > >;
}

/**
 * Gets the text of a title that the WordPress REST API returns as HTML.
 *
 * `wptexturize()` writes an apostrophe as `&#8217;`, and an author can add HTML
 * tags, so the function reads the title's text.
 *
 * @since n.e.x.t
 *
 * @param {string} renderedTitle The title as HTML, such as `Don&#8217;t <em>miss</em> it`.
 * @return {string} The title as text, such as `Don’t miss it`.
 */
function getTitleText( renderedTitle: string ): string {
	return new DOMParser().parseFromString( renderedTitle, 'text/html' ).body
		.textContent;
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
						_fields: 'id,date_gmt,link,title',
					} ),
				} )
			)
		);

		return responses
			.flat()
			.map( ( post ) => ( {
				id: post.id,
				title: getTitleText( post.title.rendered ),
				permalink: post.link,
				pagePath: new URL( post.link ).pathname,
				publishedAt: `${ post.date_gmt }Z`,
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

const fetchGetPostTitlesStore = createFetchStore( {
	baseName: 'getPostTitles',
	async controlCallback( {
		postIDs,
		pageIDs,
	}: PostTitlesOptions ): Promise< Record< number, string > > {
		const requests = [
			{ path: '/wp/v2/posts', ids: postIDs },
			{ path: '/wp/v2/pages', ids: pageIDs },
		].filter( ( { ids } ) => ids.length );

		const responses = await Promise.all(
			requests.map( ( { path, ids } ) =>
				apiFetch< Pick< WordPressPost, 'id' | 'title' >[] >( {
					path: addQueryArgs( path, {
						include: ids,
						per_page: ids.length,
						_fields: 'id,title',
					} ),
				} )
			)
		);

		return Object.fromEntries(
			responses
				.flat()
				.map( ( post ) => [
					post.id,
					getTitleText( post.title.rendered ),
				] )
		);
	},
	reducerCallback: createReducer(
		(
			state: FreshDataState,
			postTitles: Record< number, string >,
			options: PostTitlesOptions
		) => {
			state.postTitles[ stringifyObject( { ...options } ) ] = postTitles;
		}
	),
	argsToParams: ( {
		postIDs,
		pageIDs,
	}: Partial< PostTitlesOptions > = {} ) => ( {
		postIDs,
		pageIDs,
	} ),
	validateParams: ( { postIDs, pageIDs }: Partial< PostTitlesOptions > ) => {
		invariant(
			Array.isArray( postIDs ) && Array.isArray( pageIDs ),
			'postIDs and pageIDs must be arrays.'
		);
	},
} ) as {
	actions: {
		fetchGetPostTitles: ( options: PostTitlesOptions ) => unknown;
	};
};

const baseInitialState: FreshDataState = {
	recentContent: {},
	postTitles: {},
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

	*getPostTitles(
		options: PostTitlesOptions
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		if (
			registry.select( MODULES_ANALYTICS_4 ).getPostTitles( options ) !==
			undefined
		) {
			return;
		}

		yield fetchGetPostTitlesStore.actions.fetchGetPostTitles( options );
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
	 * @since n.e.x.t
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
	 * Gets the titles of the given posts and pages, as text, such as
	 * `Don’t miss it`.
	 *
	 * The titles come from the WordPress REST API, which returns published
	 * posts and pages only. Read a request error with
	 * `getErrorForSelector( 'getPostTitles', [ options ] )`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}        state           The data store's state.
	 * @param {Object}        options         The posts and pages to get the titles of.
	 * @param {Array<number>} options.postIDs The IDs of the posts, of the `post` post type.
	 * @param {Array<number>} options.pageIDs The IDs of the pages.
	 * @return {(Object|undefined)} The titles WordPress returned, by ID, or `undefined` until a request for these posts and pages succeeds. A post WordPress doesn't return, such as a deleted or private post, has no title.
	 */
	getPostTitles(
		state: FreshDataState,
		options: PostTitlesOptions
	): Record< number, string > | undefined {
		return state.postTitles[ stringifyObject( { ...options } ) ];
	},

	/**
	 * Determines whether WooCommerce products should be included alongside
	 * WordPress posts for "Fresh Data" cards/widgets.
	 *
	 * @since n.e.x.t
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
	 * 1. On plain permalinks, by the query string of its URL, such as
	 *    `/?product=hoodie`.
	 * 2. Otherwise, by the path that every product URL starts with, such as
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
				return undefined;
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
					by: 'queryVar',
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
			// such as a view-only user. Once `getAvailableCustomDimensions()`
			// has resolved, the tab can't recognize products.
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
	fetchGetPostTitlesStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export default store;
