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
import { isPlainObject } from 'lodash';

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
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { ReportFetchOptions } from '@/js/googlesitekit/data/create-get-report-resolver';
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
	  };

/**
 * One of the published single posts with the most visitors on a site with plain permalinks, as `GET:plain-permalink-top-posts` returns it.
 *
 * @since 1.191.0
 */
export interface PlainPermalinkTopPost {
	/** The ID of the post. */
	id: number;
	/** The title as text, such as `Don’t miss it`, or an empty string for a post with no title. */
	title: string;
	/** The permalink of the post, such as `https://example.com/?p=123`. */
	url: string;
	/** The permalink with no scheme or host, such as `/?p=123`. */
	pagePath: string;
	/** The visitors of the report's URLs that show the post, at least `1`. A visitor who opened the post through two URLs counts twice. */
	visitors: number;
}

/**
 * The response of `GET:plain-permalink-top-posts`, with the posts with the most visitors and the report's total visitors.
 *
 * @since 1.191.0
 */
export interface PlainPermalinkTopPosts {
	/** The posts, most visitors first. */
	rows: PlainPermalinkTopPost[];
	/** The visitors of every URL of the report, each counted once, including the URLs that show no single post. */
	total: number;
}

/**
 * The options of `getPlainPermalinkTopPosts()`.
 *
 * @since 1.191.0
 */
export interface PlainPermalinkTopPostsOptions {
	/** The first day of the report, such as `2026-10-21`. */
	startDate: string;
	/** The last day of the report, such as `2026-10-22`. */
	endDate: string;
	/** The maximum number of posts, from 1 to `Plain_Permalink_Top_Posts::MAX_PAGE_PATHS`, which is 50. The server refuses any other limit. */
	limit: number;
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
	/** The response of each request, saved under the hash that `stringifyObject()` builds from its options. */
	plainPermalinkTopPosts: Record< string, PlainPermalinkTopPosts >;
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

const fetchGetPlainPermalinkTopPostsStore = createFetchStore( {
	baseName: 'getPlainPermalinkTopPosts',
	controlCallback: (
		{ options }: { options: PlainPermalinkTopPostsOptions },
		fetchOptions?: ReportFetchOptions
	): Promise< PlainPermalinkTopPosts > =>
		get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'plain-permalink-top-posts',
			options,
			fetchOptions
		),
	reducerCallback: createReducer(
		(
			state: FreshDataState,
			topPosts: PlainPermalinkTopPosts,
			{ options }: { options: PlainPermalinkTopPostsOptions }
		) => {
			state.plainPermalinkTopPosts[ stringifyObject( { ...options } ) ] =
				topPosts;
		}
	),
	argsToParams: ( options: PlainPermalinkTopPostsOptions ) => ( {
		options,
	} ),
	validateParams: ( {
		options,
	}: Partial< { options: PlainPermalinkTopPostsOptions } > ) => {
		invariant( isPlainObject( options ), 'options must be an object.' );
	},
} ) as {
	actions: {
		fetchGetPlainPermalinkTopPosts: (
			options: PlainPermalinkTopPostsOptions,
			fetchOptions?: ReportFetchOptions
		) => unknown;
	};
};

const baseInitialState: FreshDataState = {
	recentContent: {},
	plainPermalinkTopPosts: {},
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

	*getPlainPermalinkTopPosts(
		options: PlainPermalinkTopPostsOptions,
		fetchOptions?: ReportFetchOptions
	): Generator< unknown, void, unknown > {
		yield fetchGetPlainPermalinkTopPostsStore.actions.fetchGetPlainPermalinkTopPosts(
			options,
			fetchOptions
		);
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
	 * Gets the published single posts with the most visitors on a site with plain permalinks, which has no permalink structure.
	 *
	 * Read a request error with
	 * `getErrorForSelector( 'getPlainPermalinkTopPosts', [ options ] )`.
	 *
	 * @since 1.191.0
	 *
	 * @param {Object} state             The data store's state.
	 * @param {Object} options           The options of the report.
	 * @param {string} options.startDate The first day of the report, such as `2026-10-21`.
	 * @param {string} options.endDate   The last day of the report, such as `2026-10-22`.
	 * @param {number} options.limit     The maximum number of posts, from 1 to `Plain_Permalink_Top_Posts::MAX_PAGE_PATHS`, which is 50. The server refuses any other limit.
	 * @param {Object} [fetchOptions]    Optional. Fetch options that change how the request runs, such as `{ cacheTTL }`, the seconds the response stays cached.
	 * @return {(Object|undefined)} The posts, most visitors first, as `rows`, and the visitors of every URL of the report as `total`. Returns `undefined` until the request succeeds.
	 */
	getPlainPermalinkTopPosts(
		state: FreshDataState,
		options: PlainPermalinkTopPostsOptions,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- The fetch options only change how the request runs, so the selector does not read them.
		fetchOptions?: ReportFetchOptions
	): PlainPermalinkTopPosts | undefined {
		return state.plainPermalinkTopPosts[
			stringifyObject( { ...options } )
		];
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
	 * the columns of its traffic breakdown leave out.
	 *
	 * The tab leaves products out only while WooCommerce is active and the
	 * setting to include products is off. Without WooCommerce, the setting
	 * doesn't show, so the tab counts every page. The tab recognizes a product
	 * page:
	 *
	 * 1. By the path that every product URL starts with, such as `/product/`.
	 * 2. When product URLs share no such path, by the `googlesitekit_post_type`
	 *    custom dimension, if the Analytics property has it.
	 *
	 * @since 1.191.0
	 *
	 * @return {(Object|null|undefined)} The way to recognize a product page, or `null` when the tab counts products or can't recognize them. Returns `undefined` if not yet loaded.
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
	fetchGetPlainPermalinkTopPostsStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export default store;
