/**
 * `core/user` data store: conversion reporting utils.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import {
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
} from '../user/constants';

/**
 * Gets conversion events related metrics.
 *
 * @since n.e.x.t
 * @private
 *
 * @return {Object} Metrics list object.
 */
export function getKeyMetricsConversionEventWidgets() {
	const leadRelatedMetrics = [
		KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
		KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	];

	return {
		purchase: [
			KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
			KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
			KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
		],
		add_to_cart: [
			KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
			KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
		],
		contact: leadRelatedMetrics,
		submit_lead_form: leadRelatedMetrics,
		generate_lead: leadRelatedMetrics,
	};
}
