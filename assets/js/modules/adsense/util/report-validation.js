/**
 * Reporting API validation utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { castArray } from 'lodash';

/**
 * Internal dependencies
 */
import invariant from 'invariant';

/* eslint-disable-next-line */
/** @see (@link https://developers.google.com/adsense/management/reference/rest/v2/Metric) */
const VALID_METRICS = [
	'ACTIVE_VIEW_MEASURABILITY',
	'ACTIVE_VIEW_TIME',
	'ACTIVE_VIEW_VIEWABILITY',
	'AD_REQUESTS_COVERAGE',
	'AD_REQUESTS_CTR',
	'AD_REQUESTS_RPM',
	'AD_REQUESTS_SPAM_RATIO',
	'AD_REQUESTS',
	'ADS_PER_IMPRESSION',
	'CLICKS_SPAM_RATIO',
	'CLICKS',
	'COST_PER_CLICK',
	'ESTIMATED_EARNINGS',
	'IMPRESSIONS_CTR',
	'IMPRESSIONS_RPM',
	'IMPRESSIONS_SPAM_RATIO',
	'IMPRESSIONS',
	'INDIVIDUAL_AD_IMPRESSIONS_CTR',
	'INDIVIDUAL_AD_IMPRESSIONS_RPM',
	'INDIVIDUAL_AD_IMPRESSIONS_SPAM_RATIO',
	'INDIVIDUAL_AD_IMPRESSIONS',
	'MATCHED_AD_REQUESTS_CTR',
	'MATCHED_AD_REQUESTS_RPM',
	'MATCHED_AD_REQUESTS_SPAM_RATIO',
	'MATCHED_AD_REQUESTS',
	'METRIC_UNSPECIFIED',
	'PAGE_VIEWS_CTR',
	'PAGE_VIEWS_RPM',
	'PAGE_VIEWS_SPAM_RATIO',
	'PAGE_VIEWS',
	'TOTAL_EARNINGS',
	'TOTAL_IMPRESSIONS',
	'WEBSEARCH_RESULT_PAGES',
];

/* eslint-disable-next-line */
/** @see (@link https://developers.google.com/adsense/management/reference/rest/v2/Dimension) */
const VALID_DIMENSIONS = [
	'ACCOUNT_NAME',
	'AD_CLIENT_ID',
	'AD_FORMAT_CODE',
	'AD_FORMAT_NAME',
	'AD_PLACEMENT_CODE',
	'AD_PLACEMENT_NAME',
	'AD_UNIT_ID',
	'AD_UNIT_NAME',
	'AD_UNIT_SIZE_CODE',
	'AD_UNIT_SIZE_NAME',
	'BID_TYPE_CODE',
	'BID_TYPE_NAME',
	'BUYER_NETWORK_ID',
	'BUYER_NETWORK_NAME',
	'CONTENT_PLATFORM_CODE',
	'CONTENT_PLATFORM_NAME',
	'COUNTRY_CODE',
	'COUNTRY_NAME',
	'CREATIVE_SIZE_CODE',
	'CREATIVE_SIZE_NAME',
	'CUSTOM_CHANNEL_ID',
	'CUSTOM_CHANNEL_NAME',
	'CUSTOM_SEARCH_STYLE_ID',
	'CUSTOM_SEARCH_STYLE_NAME',
	'DATE',
	'DIMENSION_UNSPECIFIED',
	'DOMAIN_CODE',
	'DOMAIN_NAME',
	'DOMAIN_REGISTRANT',
	'MONTH',
	'OWNED_SITE_DOMAIN_NAME',
	'OWNED_SITE_ID',
	'PLATFORM_TYPE_CODE',
	'PLATFORM_TYPE_NAME',
	'PRODUCT_CODE',
	'PRODUCT_NAME',
	'REQUESTED_AD_TYPE_CODE',
	'REQUESTED_AD_TYPE_NAME',
	'SERVED_AD_TYPE_CODE',
	'SERVED_AD_TYPE_NAME',
	'TARGETING_TYPE_CODE',
	'TARGETING_TYPE_NAME',
	'URL_CHANNEL_ID',
	'URL_CHANNEL_NAME',
	'WEBSEARCH_QUERY_STRING',
	'WEEK',
];

/**
 * Validates the given metrics are valid to be used in a request.
 *
 * @since 1.36.0
 *
 * @param {(Array|string)} metrics Metric(s) to validate.
 */
export function validateMetrics( metrics ) {
	const metricsArray = castArray( metrics );
	invariant( metricsArray.length, 'at least one metric is required.' );

	const invalidMetrics = metricsArray.filter(
		( metric ) => ! VALID_METRICS.includes( metric )
	);

	invariant(
		invalidMetrics.length === 0,
		`invalid AdSense metrics requested: ${ invalidMetrics.toString() }`
	);
}

/**
 * Validates the given dimensions are valid to be used in a request.
 *
 * @since 1.36.0
 *
 * @param {(Array|string)} dimensions Dimension(s) to validate.
 */
export function validateDimensions( dimensions ) {
	const dimensionsArray = castArray( dimensions );
	invariant( dimensionsArray.length, 'at least one dimension is required.' );

	const invalidDimensions = dimensionsArray.filter(
		( metric ) => ! VALID_DIMENSIONS.includes( metric )
	);

	invariant(
		invalidDimensions.length === 0,
		`invalid AdSense dimensions requested: ${ invalidDimensions.toString() }`
	);
}
