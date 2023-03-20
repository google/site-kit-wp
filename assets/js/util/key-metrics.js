/**
 * Key Metrics test utility functions.
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

import { CORE_USER } from '../googlesitekit/datastore/user/constants';

/**
 * Internal dependencies
 */

/**
 * The endpoint for the key metrics settings.
 */
export const coreKeyMetricsEndpointRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/key-metrics'
);

/**
 * Sets up the registry with the key metrics settings where isWidgetHidden is true.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 */
export const setupRegistryKeyMetricsWidgetHidden = ( registry ) => {
	registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
		widgetSlugs: [ 'test-slug' ],
		isWidgetHidden: true,
	} );
};

/**
 * Sets up the registry with the key metrics settings where isWidgetHidden is false.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 */
export const setupRegistryKeyMetricsWidgetNotHidden = ( registry ) => {
	registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
		widgetSlugs: [ 'test-slug' ],
		isWidgetHidden: false,
	} );
};
