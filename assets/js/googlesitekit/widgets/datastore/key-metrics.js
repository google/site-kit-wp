/**
 * `core/widgets` data store: key metrics data.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	CORE_WIDGETS,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from './constants';
import { CORE_SITE } from '../../datastore/site/constants';
import { CORE_USER } from '../../datastore/user/constants';

const { createRegistrySelector } = Data;

const selectors = {
	/**
	 * Gets currently selected key metrics based on either the user picked metrics or the answer based metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Array<string>|undefined} An array of key metric slugs, or undefined while loading.
	 */
	getKeyMetrics: createRegistrySelector( ( select ) => () => {
		const userPickedMetrics = select( CORE_USER ).getUserPickedMetrics();

		if ( userPickedMetrics === undefined ) {
			return undefined;
		}

		if ( userPickedMetrics.length ) {
			return userPickedMetrics;
		}

		return select( CORE_WIDGETS ).getAnswerBasedMetrics();
	} ),
	/**
	 * Gets the Key Metric widget slugs based on the user input settings.
	 *
	 * @since 1.95.0
	 *
	 * @return {Array<string>|undefined} An array of Key Metric widget slugs, or undefined if the user input settings are not loaded.
	 */
	getAnswerBasedMetrics: createRegistrySelector( ( select ) => () => {
		const userInputSettings = select( CORE_USER ).getUserInputSettings();

		if ( userInputSettings === undefined ) {
			return undefined;
		}

		const purpose = userInputSettings?.purpose?.values?.[ 0 ];

		const hasProductPostType = () => {
			const postTypes = select( CORE_SITE ).getPostTypes();
			return postTypes.some( ( { slug } ) => slug === 'product' );
		};

		switch ( purpose ) {
			case 'publish_blog':
			case 'publish_news':
				return [
					KM_ANALYTICS_LOYAL_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				];
			case 'monetize_content':
				return [
					KM_ANALYTICS_POPULAR_CONTENT,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				];
			case 'sell_products_or_service':
				return [
					hasProductPostType()
						? KM_ANALYTICS_POPULAR_PRODUCTS
						: KM_ANALYTICS_POPULAR_CONTENT,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				];

			case 'share_portfolio':
				return [
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
				];
			default:
				return [];
		}
	} ),
};

export default {
	selectors,
};
