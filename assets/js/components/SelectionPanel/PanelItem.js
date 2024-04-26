/**
 * Panel List Item.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import Data from 'googlesitekit-data';
const { useSelect, useDispatch } = Data;
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import SelectionBox from '../SelectionBox';
import {
	SELECTION_PANEL_FORM,
	SELECTION_PANEL_SELECTED_ITEMS,
} from './constants';

function PanelItem( { id, slug, title, children, savedMetrics = [] } ) {
	const selectedItems = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			SELECTION_PANEL_FORM,
			SELECTION_PANEL_SELECTED_ITEMS
		)
	);

	const { getValue } = useSelect( ( select ) => select( CORE_FORMS ) );
	const { setValues } = useDispatch( CORE_FORMS );

	const onCheckboxChange = useCallback(
		( event ) => {
			const metrics = getValue(
				SELECTION_PANEL_FORM,
				SELECTION_PANEL_SELECTED_ITEMS
			);
			setValues( SELECTION_PANEL_FORM, {
				[ SELECTION_PANEL_SELECTED_ITEMS ]: event.target.checked
					? metrics.concat( [ slug ] )
					: metrics.filter(
							( selectedMetric ) => selectedMetric !== slug
					  ),
			} );
		},
		[ getValue, setValues, slug ]
	);

	const isItemSelected = selectedItems?.includes( slug );
	const isItemDisabled = ! savedMetrics.includes( slug );

	return (
		<div className="googlesitekit-km-selection-panel-metrics__metric-item">
			<SelectionBox
				checked={ isItemSelected }
				disabled={ isItemDisabled }
				id={ id }
				onChange={ onCheckboxChange }
				title={ title }
				value={ slug }
			>
				{ children }
			</SelectionBox>
		</div>
	);
}

export default PanelItem;
