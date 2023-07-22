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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';
import Accordion from '../../Accordion';
import { KEY_METRICS_SELECTED, KEY_METRICS_SELECTION_FORM } from '../constants';
const { useSelect, useDispatch } = Data;

export default function Metrics() {
	const availableMetrics = useSelect( ( select ) =>
		pickBy( KEY_METRICS_WIDGETS, ( _value, key ) => {
			const widget = select( CORE_WIDGETS ).getWidget( key );

			if ( ! widget ) {
				return false;
			}

			return widget.modules.every( ( module ) =>
				select( CORE_MODULES ).isModuleConnected( module )
			);
		} )
	);
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const onMetricCheckboxChange = useCallback(
		( event, metric ) => {
			setValues( KEY_METRICS_SELECTION_FORM, {
				[ KEY_METRICS_SELECTED ]: event.target.checked
					? selectedMetrics.concat( [ metric ] )
					: selectedMetrics.filter( ( slug ) => slug !== metric ),
			} );
		},
		[ selectedMetrics, setValues ]
	);

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{ Object.keys( availableMetrics ).map( ( metric ) => {
				const { title, description } = availableMetrics[ metric ];

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
