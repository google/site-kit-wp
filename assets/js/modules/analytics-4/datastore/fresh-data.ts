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
import { decodeHTMLEntity } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import { MODULES_ANALYTICS_4 } from './constants';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

export interface RecentContentItem {
	/** The ID of the post or product. */
	id: number;
	/** The title with its HTML entities decoded, e.g. `Don’t miss it`, not `Don&#8217;t miss it`. */
	title: string;
	/** The URL of the post or product. */
	permalink: string;
	/** The path of `permalink`, e.g. `/hello-world/`, which matches the `pagePath` dimension of an Analytics report row. */
	pagePath: string;
	/** The publish time in UTC, not the site's local time, in ISO 8601 format, e.g. `2026-09-24T14:05:00Z`. */
	publishedAt: string;
}

interface RecentContentOptions {
	/** The number of posts and products to return. */
	count: number;
}

interface RecentContentParams extends RecentContentOptions {
	/** Whether to request products too. */
	includeProducts: boolean;
}

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
		/** The title after the `the_title` filters run, e.g. `Don&#8217;t miss it`, not `Don’t miss it`. */
		rendered: string;
	};
}

interface FreshDataState {
	/** The newest posts and products, saved under the `count` of the request. */
	recentContent: Record< number, RecentContentItem[] >;
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
					// A cached response can miss a post published just now.
					cache: 'no-store',
				} )
			)
		);

		return responses
			.flat()
			.map( ( post ) => ( {
				id: post.id,
				// WordPress runs `wptexturize()` on a title, which turns `&` into
				// `&#038;` and an apostrophe into `&#8217;`.
				title: decodeHTMLEntity( post.title.rendered ),
				permalink: post.link,
				pagePath: new URL( post.link ).pathname,
				publishedAt: `${ post.date_gmt }Z`,
			} ) )
			.sort(
				( a, b ) =>
					Date.parse( b.publishedAt ) - Date.parse( a.publishedAt )
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

const baseInitialState: FreshDataState = {
	recentContent: {},
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

		// An earlier failed request can leave its error under `[ options ]`,
		// where the fetch store doesn't clear it.
		yield clearSelectorError( 'getRecentContent', [ options ] );

		const { error } =
			( yield fetchGetRecentContentStore.actions.fetchGetRecentContent(
				options.count,
				includeProducts
			) ) as { error?: ErrorObject };

		// We move the error from the fetch store's `[ count, includeProducts ]`
		// to `[ options ]`, so a component can read it and retry the selector.
		if ( error ) {
			yield clearSelectorError( 'getRecentContent', [
				options.count,
				includeProducts,
			] );
			yield setErrorForSelector( error, 'getRecentContent', [ options ] );
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state         The data store's state.
	 * @param {Object} options       The options for the list.
	 * @param {number} options.count The number of posts and products to return.
	 * @return {(Array.<Object>|undefined)} The posts and products, newest first, or `undefined` until a request with the same `count` succeeds.
	 */
	getRecentContent(
		state: FreshDataState,
		{ count }: RecentContentOptions
	): RecentContentItem[] | undefined {
		return state.recentContent[ count ];
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
};

const store = combineStores( fetchGetRecentContentStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export default store;
