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

/**
 * Internal dependencies
 */
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { CONTEXT_MAIN_DASHBOARD_KEY_METRICS } from '../../googlesitekit/widgets/default-contexts';

/**
 * Provides key metric widgets registration data to the given registry.
 *
 * This is a temporary utility until a solidified solution is implemented to effortlessly provide
 * widget registrations to the registry.
 *
 * @since 1.105.0
 * @see {@link https://github.com/google/site-kit-wp/issues/7264} Initiative to implement a utility to provide widget registrations.
 *
 * @param {Object} registry The registry to set up.
 * @param {Object} widgets  Object containing options mapped to widget slugs.
 */
export const provideKeyMetricsWidgetRegistrations = ( registry, widgets ) => {
	registry
		.dispatch( CORE_WIDGETS )
		.registerWidgetArea( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
			title: 'Key metrics',
		} );

	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea(
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS
		);

	Object.keys( widgets ).forEach( ( slug ) => {
		registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
			Component: () => <div>Hello test.</div>,
			...widgets[ slug ],
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( slug, AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY );
	} );
};
