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
import { pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';
import MetricItem from './MetricItem';
const { useSelect } = Data;

export default function Metrics() {
	const availableMetrics = useSelect( ( select ) => {
		const { isModuleConnected } = select( CORE_MODULES );

		return pickBy( KEY_METRICS_WIDGETS, ( _value, key ) => {
			const widget = select( CORE_WIDGETS ).getWidget( key );

			if ( ! widget ) {
				return false;
			}

			return widget.modules.every( ( module ) =>
				isModuleConnected( module )
			);
		} );
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
