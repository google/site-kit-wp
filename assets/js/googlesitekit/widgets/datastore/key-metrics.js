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
import { CORE_SITE } from '../../datastore/site/constants';
import { CORE_USER } from '../../datastore/user/constants';

const { createRegistrySelector } = Data;

const selectors = {
	/**
	 * Gets the Key Metric widget slugs based on the user input settings.
	 *
	 * @since n.e.x.t
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
					'kmAnalyticsLoyalVisitors',
					'kmAnalyticsNewVisitors',
					'kmAnalyticsTopTrafficSource',
					'kmAnalyticsEngagedTrafficSource',
				];
			case 'monetize_content':
				return [
					'kmAnalyticsPopularContent',
					'kmAnalyticsEngagedTrafficSource',
					'kmAnalyticsNewVisitors',
					'kmAnalyticsTopTrafficSource',
				];
			case 'sell_products_or_service':
				if ( hasProductPostType() ) {
					return [ 'kmTopPopularProducts' ];
				}
				return [
					'kmAnalyticsPopularContent',
					'kmAnalyticsEngagedTrafficSource',
					'kmSearchConsolePopularKeywords',
					'kmAnalyticsTopTrafficSource',
				];

			case 'share_portfolio':
				return [
					'kmAnalyticsNewVisitors',
					'kmAnalyticsTopTrafficSource',
					'kmAnalyticsEngagedTrafficSource',
					'kmSearchConsolePopularKeywords',
				];
			default:
				return [];
		}
	} ),
};

export default {
	selectors,
};
