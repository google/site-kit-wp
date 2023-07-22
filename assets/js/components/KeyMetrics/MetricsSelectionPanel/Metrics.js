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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import Accordion from '../../Accordion';
const { useSelect, useDispatch } = Data;

export default function Metrics() {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);
	const keyMetricsSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);

	const { setKeyMetricsSetting } = useDispatch( CORE_USER );

	const onMetricCheckboxChange = useCallback(
		( event, metric ) => {
			const { widgetSlugs } = keyMetricsSettings;

			setKeyMetricsSetting(
				'widgetSlugs',
				event.target.checked
					? widgetSlugs.concat( [ metric ] )
					: widgetSlugs.filter( ( slug ) => slug !== metric )
			);
		},
		[ keyMetricsSettings, setKeyMetricsSetting ]
	);

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{ Object.keys( KEY_METRICS_WIDGETS ).map( ( metric ) => {
				const { title, description } = KEY_METRICS_WIDGETS[ metric ];

				const id = `key-metric-selection-checkbox-${ metric }`;

				return (
					<div
						key={ id }
						className="googlesitekit-km-selection-panel-metrics__metric-item"
					>
						<Accordion
							title={
								<Checkbox
									checked={ selectedMetrics?.includes(
										metric
									) }
									onChange={ ( event ) => {
										onMetricCheckboxChange( event, metric );
									} }
									onClick={ ( event ) => {
										event.stopPropagation();
									} }
									disabled={
										! selectedMetrics?.includes( metric ) &&
										selectedMetrics?.length > 3
									}
									id={ id }
									name={ id }
									value={ metric }
								>
									{ title }
								</Checkbox>
							}
							disabled={
								! selectedMetrics?.includes( metric ) &&
								selectedMetrics?.length > 3
							}
						>
							{ description }
						</Accordion>
					</div>
				);
			} ) }
		</div>
	);
}
