/**
 * Manipulate key metrics widgets data in E2E tests.
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
import { wpApiFetch } from './wp-api-fetch';

/* eslint-disable jsdoc/check-line-alignment */
/**
 * Sets key metrics widgets during E2E tests.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} widgetSlugs Array of widget slugs.
 * @param {boolean} isWidgetHidden Hide/Show thw widget.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function setKeyMetricsWidgets(
	widgetSlugs,
	isWidgetHidden = false
) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/key-metrics/set-widgets',
		method: 'post',
		data: {
			settings: {
				isWidgetHidden,
				widgetSlugs,
			},
		},
	} );
}

/**
 * Removes saved key metrics widgets during E2E tests.
 *
 * @since n.e.x.t
 *
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function removeKeyMetricsWidgets() {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/key-metrics/set-widgets',
		method: 'post',
		data: {
			widgetSlugs: false,
		},
	} );
}

/**
 * Saves set_key_metrics_setup_completed setting during E2E tests.
 *
 * @since n.e.x.t
 *
 * @param {number} userdID ID of the user.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function setKeyMetricsSetupCompleted( userdID ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/key-metrics/set-key-metrics-setup-completed',
		method: 'post',
		data: {
			'key-metrics-setup-completed': userdID,
		},
	} );
}
