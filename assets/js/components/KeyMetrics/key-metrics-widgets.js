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
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	CORE_USER,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { shouldDisplayWidgetWithConversionEvent } from './shouldDisplayWidgetWithConversionEvent';

/**
 * Determines whether to show a widget the requires Analytics 4 and AdSense to be linked.
 *
 * For admin dashboards, the widget will be shown if both modules are activate so that
 * the connection CTA can be shown if they have not been linked.
 *
 * For view-only dashboards, the widget will only be displayed if both modules are linked.
 *
 * @since 1.121.0
 *
 * @param {Function} select              Data store select function.
 * @param {boolean}  isViewOnlyDashboard Whether the current dashboard is view only.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithAnalytics4AndAdSenseLinked(
	select,
	isViewOnlyDashboard
) {
	if (
		! select( CORE_MODULES ).isModuleConnected( 'analytics-4' ) ||
		! select( CORE_MODULES ).isModuleConnected( 'adsense' )
	) {
		return false;
	}

	if ( ! isViewOnlyDashboard ) {
		return true;
	}

	if (
		isViewOnlyDashboard &&
		select( MODULES_ANALYTICS_4 ).getAdSenseLinked()
	) {
		return true;
	}

	return false;
}

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
 * @since 1.113.0
 *
 * @param {Function} select              Data store select function.
 * @param {boolean}  isViewOnlyDashboard Whether the current dashboard is view only.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithCustomDimensions(
	select,
	isViewOnlyDashboard
) {
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
	[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
		title: __( 'Top earning pages', 'google-site-kit' ),
		description: __(
			'Pages that generated the most AdSense revenue',
			'google-site-kit'
		),
		infoTooltip: __(
			'Pages that generated the most AdSense revenue',
			'google-site-kit'
		),
		displayInList: shouldDisplayWidgetWithAnalytics4AndAdSenseLinked,
	},
	[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]: {
		title: __( 'Top recent trending pages', 'google-site-kit' ),
		description: __(
			'Pages with the most pageviews published in the last 3 days',
			'google-site-kit'
		),
		infoTooltip: __(
			'Pages with the most pageviews published in the last 3 days',
			'google-site-kit'
		),
		requiredCustomDimensions: [ 'googlesitekit_post_date' ],
		displayInList: shouldDisplayWidgetWithCustomDimensions,
	},
	[ KM_ANALYTICS_POPULAR_AUTHORS ]: {
		title: __( 'Most popular authors by pageviews', 'google-site-kit' ),
		description: __(
			'Authors whose posts got the most visits',
			'google-site-kit'
		),
		infoTooltip: __(
			'Authors whose posts got the most visits',
			'google-site-kit'
		),
		requiredCustomDimensions: [ 'googlesitekit_post_author' ],
		displayInList: shouldDisplayWidgetWithCustomDimensions,
	},
	[ KM_ANALYTICS_TOP_CATEGORIES ]: {
		title: __( 'Top categories by pageviews', 'google-site-kit' ),
		description: __(
			'Categories that your site visitors viewed the most',
			'google-site-kit'
		),
		infoTooltip: __(
			'Categories that your site visitors viewed the most',
			'google-site-kit'
		),
		requiredCustomDimensions: [ 'googlesitekit_post_categories' ],
		displayInList: shouldDisplayWidgetWithCustomDimensions,
	},
	[ KM_ANALYTICS_POPULAR_CONTENT ]: {
		title: __( 'Most popular content by pageviews', 'google-site-kit' ),
		description: __(
			'Pages that brought in the most visitors',
			'google-site-kit'
		),
		infoTooltip: __(
			'Pages your visitors read the most',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_POPULAR_PRODUCTS ]: {
		title: __( 'Most popular products by pageviews', 'google-site-kit' ),
		description: __(
			'Products that brought in the most visitors',
			'google-site-kit'
		),
		requiredCustomDimensions: [ 'googlesitekit_post_type' ],
		displayInList: ( select ) =>
			select( CORE_USER ).isKeyMetricActive(
				KM_ANALYTICS_POPULAR_PRODUCTS
			) || select( CORE_SITE ).getProductPostType(),
	},
	[ KM_ANALYTICS_PAGES_PER_VISIT ]: {
		title: __( 'Pages per visit', 'google-site-kit' ),
		description: __(
			'Number of pages visitors viewed per session on average',
			'google-site-kit'
		),
		infoTooltip: __(
			'Number of pages visitors viewed per session on average',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_VISIT_LENGTH ]: {
		title: __( 'Visit length', 'google-site-kit' ),
		description: __(
			'Average duration of engaged visits',
			'google-site-kit'
		),
		infoTooltip: __(
			'Average duration of engaged visits',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_VISITS_PER_VISITOR ]: {
		title: __( 'Visits per visitor', 'google-site-kit' ),
		description: __(
			'Average number of sessions per site visitor',
			'google-site-kit'
		),
		infoTooltip: __(
			'Average number of sessions per site visitor',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_MOST_ENGAGING_PAGES ]: {
		title: __( 'Most engaging pages', 'google-site-kit' ),
		description: __(
			'Pages with the highest engagement rate',
			'google-site-kit'
		),
		infoTooltip: __(
			'Pages with the highest engagement rate',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_LEAST_ENGAGING_PAGES ]: {
		title: __( 'Least engaging pages', 'google-site-kit' ),
		description: __(
			'Pages with the highest percentage of visitors that left without engagement with your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Percentage of visitors that left without engagement with your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES ]: {
		title: __( 'Top pages by returning visitors', 'google-site-kit' ),
		description: __(
			'Pages that attracted the most returning visitors',
			'google-site-kit'
		),
		infoTooltip: __(
			'Pages that attracted the most returning visitors',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_NEW_VISITORS ]: {
		title: __( 'New visitors', 'google-site-kit' ),
		description: __(
			'How many new visitors you got and how the overall audience changed',
			'google-site-kit'
		),
		infoTooltip: __(
			'Portion of visitors who visited your site for the first time in this timeframe',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_RETURNING_VISITORS ]: {
		title: __( 'Returning visitors', 'google-site-kit' ),
		description: __(
			'Portion of people who visited your site more than once',
			'google-site-kit'
		),
		infoTooltip: __(
			'Portion of your site’s visitors that returned at least once in this timeframe',
			'google-site-kit'
		),
	},

	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE ]: {
		title: __( 'Top traffic source', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most visitors to your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in the most visitors to your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART ]: {
		title: __(
			'Top traffic source driving add to cart',
			'google-site-kit'
		),
		description: __(
			'Traffic source that generates the most add to cart events',
			'google-site-kit'
		),
		infoTooltip: __(
			'Traffic source that generates the most add to cart events',
			'google-site-kit'
		),
		requiredConversionEventName: [ 'add_to_cart' ],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS ]: {
		title: __( 'Top traffic source driving leads', 'google-site-kit' ),
		description: __(
			'Total number of leads for the top traffic source',
			'google-site-kit'
		),
		infoTooltip: __(
			'Total number of leads for the top traffic source',
			'google-site-kit'
		),
		requiredConversionEventName: [
			'submit_lead_form',
			'contact',
			'generate_lead',
		],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES ]: {
		title: __( 'Top traffic source driving purchases', 'google-site-kit' ),
		description: __(
			'Traffic source that generates the most purchases',
			'google-site-kit'
		),
		infoTooltip: __(
			'Traffic source that generates the most purchases',
			'google-site-kit'
		),
		requiredConversionEventName: [ 'purchase' ],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE ]: {
		title: __( 'Most engaged traffic source', 'google-site-kit' ),
		description: __(
			'Visitors coming via this channel spent the most time on your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in the most visitors who had a meaningful engagement with your site',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ]: {
		title: __( 'Top converting traffic source', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most visits that resulted in conversions',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in visitors who generated the most conversions',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_CITIES ]: {
		title: __( 'Top cities driving traffic', 'google-site-kit' ),
		description: __(
			'Which cities you get the most visitors from',
			'google-site-kit'
		),
		infoTooltip: __(
			'The cities where most of your visitors came from',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS ]: {
		title: __( 'Top cities driving leads', 'google-site-kit' ),
		description: __(
			'Cities driving the most contact form submissions',
			'google-site-kit'
		),
		infoTooltip: __(
			'Cities driving the most contact form submissions',
			'google-site-kit'
		),
		requiredConversionEventName: [
			'submit_lead_form',
			'contact',
			'generate_lead',
		],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART ]: {
		title: __( 'Top cities driving add to cart', 'google-site-kit' ),
		description: __(
			'Cities where visitors most frequently add products to their carts',
			'google-site-kit'
		),
		infoTooltip: __(
			'Cities where visitors most frequently add products to their carts',
			'google-site-kit'
		),
		requiredConversionEventName: [ 'add_to_cart' ],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES ]: {
		title: __( 'Top cities driving purchases', 'google-site-kit' ),
		description: __(
			'Cities driving the most purchases',
			'google-site-kit'
		),
		infoTooltip: __(
			'Cities driving the most purchases',
			'google-site-kit'
		),
		requiredConversionEventName: [ 'purchase' ],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES ]: {
		title: __( 'Top device driving purchases', 'google-site-kit' ),
		description: __(
			'Top device driving the most purchases',
			'google-site-kit'
		),
		infoTooltip: __(
			'Top device driving the most purchases',
			'google-site-kit'
		),
		requiredConversionEventName: [ 'purchase' ],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
	[ KM_ANALYTICS_TOP_COUNTRIES ]: {
		title: __( 'Top countries driving traffic', 'google-site-kit' ),
		description: __(
			'Which countries you get the most visitors from',
			'google-site-kit'
		),
		infoTooltip: __(
			'The countries where most of your visitors came from',
			'google-site-kit'
		),
	},
	[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
		title: __( 'Top performing keywords', 'google-site-kit' ),
		description: __(
			'What people searched for before they came to your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'The top search queries for your site by highest clickthrough rate',
			'google-site-kit'
		),
	},
	[ KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS ]: {
		title: __( 'Top pages driving leads', 'google-site-kit' ),
		description: __(
			'Pages on which forms are most frequently submitted',
			'google-site-kit'
		),
		requiredConversionEventName: [
			'submit_lead_form',
			'contact',
			'generate_lead',
		],
		displayInList: shouldDisplayWidgetWithConversionEvent,
	},
};

export { KEY_METRICS_WIDGETS };
