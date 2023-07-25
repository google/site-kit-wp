/**
 * Key Metrics Selection Panel MetricItem
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { KEY_METRICS_SELECTED, KEY_METRICS_SELECTION_FORM } from '../constants';
import Accordion from '../../Accordion';
const { useSelect, useDispatch } = Data;

export default function MetricItem( { id, slug, title, description } ) {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const onCheckboxChange = useCallback(
		( event ) => {
			setValues( KEY_METRICS_SELECTION_FORM, {
				[ KEY_METRICS_SELECTED ]: event.target.checked
					? selectedMetrics.concat( [ slug ] )
					: selectedMetrics.filter(
							( selectedMetric ) => selectedMetric !== slug
					  ),
			} );
		},
		[ selectedMetrics, setValues, slug ]
	);

	return (
		<div className="googlesitekit-km-selection-panel-metrics__metric-item">
			<Accordion
				title={
					<div
						onClick={ ( event ) => {
							event.stopPropagation();
						} }
						onKeyDown={ () => {} }
						tabIndex={ 0 }
						role="button"
					>
						<Checkbox
							checked={ selectedMetrics?.includes( slug ) }
							onChange={ onCheckboxChange }
							disabled={
								! selectedMetrics?.includes( slug ) &&
								selectedMetrics?.length > 3
							}
							id={ id }
							name={ id }
							value={ slug }
						>
							{ title }
						</Checkbox>
					</div>
				}
				disabled={
					! selectedMetrics?.includes( slug ) &&
					selectedMetrics?.length > 3
				}
			>
				{ description }
			</Accordion>
		</div>
	);
}

MetricItem.propTypes = {
	id: PropTypes.string.isRequired,
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};
