/**
 * Key Metrics widgets metadata.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	CORE_USER,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { isFeatureEnabled } from '../../features';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

/**
 * Determines whether to display a widget that requires custom dimensions in the key
 * metrics selection panel.
 *
 * All widgets are displayed in authenticated dashboard. However, in view only dashboard,
 * widgets that require custom dimensions will only be displayed if the required custom
 * dimensions are available in the shared property.
 *
 * This function is attached to the widget object that requires the custom dimensions and
 * has the `requiredCustomDimensions` property.
 *
 * @since n.e.x.t
 *
 * @param {Function} select              Data store select function.
 * @param {boolean}  isViewOnlyDashboard Whether the current dashboard is view only.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithCustomDimensions(
	select,
	isViewOnlyDashboard
) {
	if ( ! isFeatureEnabled( 'newsKeyMetrics' ) ) {
		return false;
	}

	if ( ! isViewOnlyDashboard ) {
		return true;
	}

	return select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
		// This property is available to the widget object that requires the
		// custom dimensions, where the function is attached.
		this.requiredCustomDimensions
	);
}

const KEY_METRICS_WIDGETS = {
	[ KM_ANALYTICS_LOYAL_VISITORS ]: {
		title: __( 'Loyal visitors', 'google-site-kit' ),
		description: __(
			'Portion of people who visited your site more than once',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_NEW_VISITORS ]: {
		title: __( 'New visitors', 'google-site-kit' ),
		description: __(
			'How many new visitors you got and how the overall audience changed',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE ]: {
		title: __( 'Top traffic source', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most visitors to your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE ]: {
		title: __( 'Most engaged traffic source', 'google-site-kit' ),
		description: __(
			'Visitors coming via this channel spent the most time on your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_POPULAR_CONTENT ]: {
		title: __( 'Most popular content by pageviews', 'google-site-kit' ),
		description: __(
			'Pages that brought in the most visitors',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_POPULAR_PRODUCTS ]: {
		title: __( 'Most popular products by pageviews', 'google-site-kit' ),
		description: __(
			'Products that brought in the most visitors',
			'google-site-kit'
		),
		displayInList: ( select ) =>
			select( CORE_USER ).isKeyMetricActive(
				KM_ANALYTICS_POPULAR_PRODUCTS
			) || select( CORE_SITE ).getProductBasePaths()?.length > 0,
	},
	[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
		title: __( 'Top performing keywords', 'google-site-kit' ),
		description: __(
			'What people searched for before they came to your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_CITIES ]: {
		title: __( 'Top cities driving traffic', 'google-site-kit' ),
		description: __(
			'Which cities you get the most visitors from',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_COUNTRIES ]: {
		title: __( 'Top countries driving traffic', 'google-site-kit' ),
		description: __(
			'Which countries you get the most visitors from',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ]: {
		title: __( 'Top converting traffic source', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most visits that resulted in conversions',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_VISITS_PER_VISITOR ]: {
		title: __( 'Visits per visitor', 'google-site-kit' ),
		description: __(
			'Average number of sessions per site visitor',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_LEAST_ENGAGING_PAGES ]: {
		title: __( 'Least engaging pages', 'google-site-kit' ),
		description: __(
			'Pages with the highest bounce rate (visitors who left without any meaningful engagement with your site)',
			'google-site-kit'
		),
		// TODO: Remove this once we have the correct custom dimensions.
		requiredCustomDimensions: [
			'googlesitekit_post_author',
			'googlesitekit_post_categories',
		],
		displayInList: shouldDisplayWidgetWithCustomDimensions,
	},
	[ KM_ANALYTICS_PAGES_PER_VISIT ]: {
		title: __( 'Pages per visit', 'google-site-kit' ),
		description: __(
			'Number of pages visitors viewed per session on average',
			'google-site-kit'
		),
		// TODO: Remove this once we have the correct custom dimensions.
		requiredCustomDimensions: [
			'googlesitekit_post_author',
			'googlesitekit_post_categories',
		],
		displayInList: shouldDisplayWidgetWithCustomDimensions,
	},
	[ KM_ANALYTICS_VISIT_LENGTH ]: {
		title: __( 'Visit length', 'google-site-kit' ),
		description: __(
			'Average duration of engaged visits',
			'google-site-kit'
		),
		displayInList: () => isFeatureEnabled( 'newsKeyMetrics' ),
	},
	[ KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES ]: {
		title: __( 'Top pages by returning visitors', 'google-site-kit' ),
		description: __(
			'Pages that attracted the most returning visitors',
			'google-site-kit'
		),
		displayInList: () => isFeatureEnabled( 'newsKeyMetrics' ),
	},
	[ KM_ANALYTICS_MOST_ENGAGING_PAGES ]: {
		title: __( 'Most engaging pages', 'google-site-kit' ),
		description: __(
			'Pages with the highest engagement rate',
			'google-site-kit'
		),
		displayInList: () => isFeatureEnabled( 'newsKeyMetrics' ),
	},
};

export { KEY_METRICS_WIDGETS };
