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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
	KM_ANALYTICS_FORM_COMPLETION_RATE,
	KM_ANALYTICS_LEADS_BY_COUNTRIES,
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
	KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_SALES_BY_COUNTRIES,
	KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
	KM_ANALYTICS_SALES_RATE,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
	KM_ANALYTICS_TOTAL_SALES,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
	KEY_METRICS_GROUP_DRIVING_TRAFFIC,
	KEY_METRICS_GROUP_GENERATING_LEADS,
	KEY_METRICS_GROUP_SELLING_PRODUCTS,
	KEY_METRICS_GROUP_VISITORS,
} from './constants';
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
 * @param {Object}   options                     Options object.
 * @param {Function} options.select              Data store select function.
 * @param {boolean}  options.isViewOnlyDashboard Whether the current dashboard is view only.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithAnalytics4AndAdSenseLinked( {
	select,
	isViewOnlyDashboard,
} ) {
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
 * @param {Object}   options                     Options object.
 * @param {Function} options.select              Data store select function.
 * @param {boolean}  options.isViewOnlyDashboard Whether the current dashboard is view only.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithCustomDimensions( {
	select,
	isViewOnlyDashboard,
} ) {
	if ( ! isViewOnlyDashboard ) {
		return true;
	}

	return select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
		// This property is available to the widget object that requires the
		// custom dimensions, where the function is attached.
		this.requiredCustomDimensions
	);
}

/**
 * Determines whether to display a widget that requires both a conversion
 * reporting event and custom dimensions in the key metrics selection panel.
 *
 * This function is attached to the widget object that requires both and has
 * the `requiredConversionEventName` and `requiredCustomDimensions` properties.
 *
 * @since n.e.x.t
 *
 * @param {Object}   options                     Options object.
 * @param {Function} options.select              Data store select function.
 * @param {boolean}  options.isViewOnlyDashboard Whether the current dashboard is view only.
 * @param {string}   options.slug                Key metric widget slug.
 * @return {boolean} Whether to display the widget.
 */
function shouldDisplayWidgetWithConversionEventAndCustomDimensions( options ) {
	return (
		shouldDisplayWidgetWithConversionEvent.call( this, options ) &&
		shouldDisplayWidgetWithCustomDimensions.call( this, options )
	);
}

/**
 * Key metric tile configurations, keyed by metric slug.
 *
 * Each entry configures how the metric appears in the selection panel and on the
 * dashboard (`title`, `description`, `infoTooltip`, `metadata`, and the various
 * display predicates).
 *
 * A metric's PDF export configuration lives in `key-metrics-pdf-tiles.js`,
 * keyed by the same slug, so this module never imports a widget component.
 *
 * - `pdfTile.TileComponent`: the `@react-pdf/renderer` component for the tile,
 *   wrapped with `lazyWithPreload` so this module stays free of the PDF renderer
 *   on the dashboard bundle. It receives the tile `title` plus the fields
 *   returned by `getTileData`.
 * - `pdfTile.getTileData( { registry, dates, signal, viewOnly } )`: resolves the
 *   report(s) the tile needs and returns the normalised data the `TileComponent`
 *   consumes, or `null` when the export is canceled.
 *
 * Entries without a `pdfTile` field do not render in the PDF and are skipped.
 *
 * @since 1.184.0 Added the optional `pdfTile` field.
 */
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
		displayInSelectionPanel:
			shouldDisplayWidgetWithAnalytics4AndAdSenseLinked,
		displayInList: shouldDisplayWidgetWithAnalytics4AndAdSenseLinked,
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		displayInSelectionPanel: shouldDisplayWidgetWithCustomDimensions,
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		displayInList: shouldDisplayWidgetWithCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		displayInSelectionPanel: shouldDisplayWidgetWithCustomDimensions,
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		displayInList: shouldDisplayWidgetWithCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		displayInSelectionPanel: shouldDisplayWidgetWithCustomDimensions,
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		displayInList: shouldDisplayWidgetWithCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
	},
	[ KM_ANALYTICS_POPULAR_PRODUCTS ]: {
		title: __( 'Most popular products by pageviews', 'google-site-kit' ),
		description: __(
			'Products that brought in the most visitors',
			'google-site-kit'
		),
		requiredCustomDimensions: [ 'googlesitekit_post_type' ],
		displayInSelectionPanel: ( { select } ) =>
			select( CORE_USER ).isKeyMetricActive(
				KM_ANALYTICS_POPULAR_PRODUCTS
			) || select( CORE_SITE ).getProductPostType(),
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_CONTENT_PERFORMANCE.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART ]: {
		title: __(
			'Top traffic source driving add to cart',
			'google-site-kit'
		),
		description: __(
			'Channel which brought in the most add to cart events to your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in the most add to cart events to your site',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS ]: {
		title: __( 'Top traffic source driving leads', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most leads to your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in the most leads to your site',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES ]: {
		title: __( 'Top traffic source driving purchases', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most purchases to your site',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in the most purchases to your site',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
	},
	[ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ]: {
		title: __( 'Top converting traffic source', 'google-site-kit' ),
		description: __(
			'Channel which brought in the most visits that resulted in key events',
			'google-site-kit'
		),
		infoTooltip: __(
			'Channel (e.g. social, paid, search) that brought in visitors who generated the most key events',
			'google-site-kit'
		),
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
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
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
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
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
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
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
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
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
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
		metadata: { group: KEY_METRICS_GROUP_DRIVING_TRAFFIC.SLUG },
	},
	[ KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS ]: {
		title: __( 'Top pages driving leads', 'google-site-kit' ),
		description: __(
			'Pages on which forms are most frequently submitted',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_TOTAL_SALES ]: {
		title: __( 'Total sales', 'google-site-kit' ),
		description: __(
			'The number of purchases made on your site during the selected date range',
			'google-site-kit'
		),
		infoTooltip: __(
			'The number of purchases made on your site during the selected date range',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_SALES_RATE ]: {
		title: __( 'Sales rate', 'google-site-kit' ),
		description: __(
			'The percentage of total visitors who successfully completed a key action, like making a purchase',
			'google-site-kit'
		),
		infoTooltip: __(
			'The percentage of total visitors who successfully completed a key action, like making a purchase',
			'google-site-kit'
		),
		documentationLinkSlug: 'site-goals-online-store-key-action',
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_SALES_ENGAGEMENT_RATE ]: {
		title: __( 'Sales engagement rate', 'google-site-kit' ),
		description: __(
			'The percentage of visitors who engaged with your content by staying on a page for a period of time, viewing multiple pages, or completing a key action',
			'google-site-kit'
		),
		infoTooltip: __(
			'The percentage of visitors who engaged with your content by staying on a page for a period of time, viewing multiple pages, or completing a key action',
			'google-site-kit'
		),
		documentationLinkSlug: 'site-goals-engagement-rate',
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE ]: {
		title: __( 'Top traffic channels by sales rate', 'google-site-kit' ),
		description: __(
			'Which channels have the highest percentage of buyers?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which channels have the highest percentage of buyers?',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_SALES_BY_VISITOR_TYPE ]: {
		title: __( 'Sales by visitor type', 'google-site-kit' ),
		description: __(
			'Which types of visitors are most likely to buy?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which types of visitors are most likely to buy?',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_SALES_BY_COUNTRIES ]: {
		title: __( 'Sales by countries', 'google-site-kit' ),
		description: __(
			'Which countries bring in the most buyers?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which countries bring in the most buyers?',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES ]: {
		title: __( 'Top authors driving sales', 'google-site-kit' ),
		description: __(
			'Whose content is best at converting buyers?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Whose content is best at converting buyers?',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		requiredCustomDimensions: [ 'googlesitekit_post_author' ],
		displayInSelectionPanel:
			shouldDisplayWidgetWithConversionEventAndCustomDimensions,
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		displayInList:
			shouldDisplayWidgetWithConversionEventAndCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_TOP_PAGES_DRIVING_SALES ]: {
		title: __( 'Top pages driving sales', 'google-site-kit' ),
		description: __(
			'Which pages bring in the most sales?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which pages bring in the most sales?',
			'google-site-kit'
		),
		requiredConversionEventName: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_SELLING_PRODUCTS.SLUG },
	},
	[ KM_ANALYTICS_TOTAL_FORM_COMPLETIONS ]: {
		title: __( 'Total Form completions', 'google-site-kit' ),
		description: __(
			'The number of form completions on your site during the selected date range',
			'google-site-kit'
		),
		infoTooltip: __(
			'The number of form completions on your site during the selected date range',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_FORM_COMPLETION_RATE ]: {
		title: __( 'Form completion rate', 'google-site-kit' ),
		description: __(
			'The percentage of total visitors who successfully completed a key action, like submitting a form',
			'google-site-kit'
		),
		infoTooltip: __(
			'The percentage of total visitors who successfully completed a key action, like submitting a form',
			'google-site-kit'
		),
		documentationLinkSlug: 'site-goals-lead-generation-key-action',
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE ]: {
		title: __( 'Form completion engagement rate', 'google-site-kit' ),
		description: __(
			'The percentage of visitors who engaged with your content by staying on a page for a period of time, viewing multiple pages, or completing a key action',
			'google-site-kit'
		),
		infoTooltip: __(
			'The percentage of visitors who engaged with your content by staying on a page for a period of time, viewing multiple pages, or completing a key action',
			'google-site-kit'
		),
		documentationLinkSlug: 'site-goals-engagement-rate',
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE ]: {
		title: __(
			'Top traffic channels by form completion rate',
			'google-site-kit'
		),
		description: __(
			'Which channels have the highest percentage of leads?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which channels have the highest percentage of leads?',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_LEADS_BY_VISITOR_TYPE ]: {
		title: __( 'Leads by visitor type', 'google-site-kit' ),
		description: __(
			'Which types of visitors are most likely to become a lead?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which types of visitors are most likely to become a lead?',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_LEADS_BY_COUNTRIES ]: {
		title: __( 'Leads by countries', 'google-site-kit' ),
		description: __(
			'Which countries bring in the most leads?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which countries bring in the most leads?',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_LEADS_BY_DEVICE_TYPE ]: {
		title: __( 'Leads by device type', 'google-site-kit' ),
		description: __(
			'Which devices bring in the most leads?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Which devices bring in the most leads?',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		displayInSelectionPanel: shouldDisplayWidgetWithConversionEvent,
		displayInList: shouldDisplayWidgetWithConversionEvent,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
	[ KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS ]: {
		title: __( 'Top authors driving leads', 'google-site-kit' ),
		description: __(
			'Whose content is best at converting leads?',
			'google-site-kit'
		),
		infoTooltip: __(
			'Whose content is best at converting leads?',
			'google-site-kit'
		),
		requiredConversionEventName: [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		],
		requiredCustomDimensions: [ 'googlesitekit_post_author' ],
		displayInSelectionPanel:
			shouldDisplayWidgetWithConversionEventAndCustomDimensions,
		displayInWidgetArea: shouldDisplayWidgetWithCustomDimensions,
		displayInList:
			shouldDisplayWidgetWithConversionEventAndCustomDimensions,
		metadata: { group: KEY_METRICS_GROUP_GENERATING_LEADS.SLUG },
	},
};

export { KEY_METRICS_WIDGETS };
