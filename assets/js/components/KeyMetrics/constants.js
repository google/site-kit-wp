/**
 * Key Metrics components - constants.
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

export const KEY_METRICS_SETUP_CTA_WIDGET_SLUG = 'key-metrics-setup-cta-widget';

export const KEY_METRICS_SELECTION_PANEL_OPENED_KEY =
	'googlesitekit-key-metrics-selection-panel-opened';
export const KEY_METRICS_SELECTION_FORM = 'key-metrics-selection-form';
export const KEY_METRICS_SELECTED = 'key-metrics-selected';
export const MIN_SELECTED_METRICS_COUNT = 2;
export const MAX_SELECTED_METRICS_COUNT = 4;
export const MAX_SELECTED_METRICS_COUNT_WITH_CONVERSION_EVENTS = 8;

export const KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG = 'current-selection';
export const KEY_METRICS_GROUP_VISITORS = {
	SLUG: 'visitors',
	LABEL: __( 'Visitors', 'google-site-kit' ),
};
export const KEY_METRICS_GROUP_DRIVING_TRAFFIC = {
	SLUG: 'driving-traffic',
	LABEL: __( 'Driving traffic', 'google-site-kit' ),
};
export const KEY_METRICS_GROUP_GENERATING_LEADS = {
	SLUG: 'generating-leads',
	LABEL: __( 'Generating leads', 'google-site-kit' ),
};
export const KEY_METRICS_GROUP_SELLING_PRODUCTS = {
	SLUG: 'selling-products',
	LABEL: __( 'Selling products', 'google-site-kit' ),
};
export const KEY_METRICS_GROUP_CONTENT_PERFORMANCE = {
	SLUG: 'content-performance',
	LABEL: __( 'Content performance', 'google-site-kit' ),
};

export const KEY_METRICS_GROUPS = [
	KEY_METRICS_GROUP_VISITORS,
	KEY_METRICS_GROUP_DRIVING_TRAFFIC,
	KEY_METRICS_GROUP_GENERATING_LEADS,
	KEY_METRICS_GROUP_SELLING_PRODUCTS,
	KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
];
