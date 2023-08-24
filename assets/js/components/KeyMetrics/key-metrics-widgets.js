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
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../googlesitekit/datastore/user/constants';

export const KEY_METRICS_WIDGETS = {
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
	},
	[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
		title: __( 'How people find your site', 'google-site-kit' ),
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
};
