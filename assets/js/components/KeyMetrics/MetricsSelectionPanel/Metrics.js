/**
 * Key Metrics Selection Panel Metrics Listing
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../../googlesitekit/widgets/default-areas';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import MetricItem from './MetricItem';
const { useSelect } = Data;

export default function Metrics( { savedMetrics } ) {
	const availableMetrics = useSelect( ( select ) => {
		const widgets =
			select( CORE_WIDGETS ).getWidgets(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
			) || [];

		const metrics = widgets
			.filter( ( { slug } ) => savedMetrics.includes( slug ) )
			.map( ( { slug } ) => slug );

		const { isKeyMetricAvailable } = select( CORE_USER );

		return Object.keys( KEY_METRICS_WIDGETS )
			.sort(
				( a, b ) =>
					metrics.includes( b ) - metrics.includes( a ) ||
					metrics.indexOf( a ) - metrics.indexOf( b )
			)
			.reduce( ( acc, metric ) => {
				if ( ! isKeyMetricAvailable( metric ) ) {
					return acc;
				}

				if (
					typeof KEY_METRICS_WIDGETS[ metric ].displayInList ===
						'function' &&
					! KEY_METRICS_WIDGETS[ metric ].displayInList( select )
				) {
					return acc;
				}

				return { ...acc, [ metric ]: KEY_METRICS_WIDGETS[ metric ] };
			}, {} );
	} );

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{ Object.keys( availableMetrics ).map( ( slug ) => {
				const { title, description } = availableMetrics[ slug ];

				const id = `key-metric-selection-checkbox-${ slug }`;

				return (
					<MetricItem
						key={ id }
						id={ id }
						slug={ slug }
						title={ title }
						description={ description }
					/>
				);
			} ) }
		</div>
	);
}

Metrics.propTypes = {
	savedMetrics: PropTypes.array,
};
