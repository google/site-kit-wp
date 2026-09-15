/**
 * Get saved viewable metrics utility.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Select } from 'googlesitekit-data';
import { KEY_METRICS_WIDGETS } from '@/js/components/KeyMetrics/key-metrics-widgets';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

type DisplayInSelectionPanel = ( args: {
	select: Select;
	isViewOnlyDashboard: boolean;
	slug: string;
} ) => boolean;

const keyMetricsWidgets = KEY_METRICS_WIDGETS as Record<
	string,
	{ displayInSelectionPanel?: DisplayInSelectionPanel }
>;

/**
 * Gets the user's saved key metric slugs that are still displayable in the
 * Key Metrics selection panel.
 *
 * `getKeyMetrics()` returns everything the user has saved, and
 * `isKeyMetricAvailable()` only checks that a widget's module is connected
 * or shared.
 *
 * @since n.e.x.t
 *
 * @param {Object}   options                     Options object.
 * @param {Function} options.select              Data store select function.
 * @param {boolean}  options.isViewOnlyDashboard Whether the current dashboard is view-only.
 * @return {Array<string>} The filtered key metric slugs.
 */
export default function getSavedViewableMetrics( {
	select,
	isViewOnlyDashboard,
}: {
	select: Select;
	isViewOnlyDashboard: boolean;
} ): string[] {
	const metrics = select( CORE_USER ).getKeyMetrics();

	if ( ! Array.isArray( metrics ) ) {
		return [];
	}

	const { isKeyMetricAvailable } = select( CORE_USER );

	return metrics.filter( ( slug: string ) => {
		if ( ! isKeyMetricAvailable( slug ) ) {
			return false;
		}

		const widget = keyMetricsWidgets[ slug ];

		if ( typeof widget?.displayInSelectionPanel !== 'function' ) {
			return true;
		}

		return widget.displayInSelectionPanel( {
			select,
			isViewOnlyDashboard,
			slug,
		} );
	} );
}
