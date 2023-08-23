/**
 * Key Metrics Selection Panel
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
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from '../constants';
import SideSheet from '../../SideSheet';
import Header from './Header';
import Footer from './Footer';
import Metrics from './Metrics';
const { useSelect, useDispatch } = Data;

export default function MetricsSelectionPanel() {
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);
	const savedViewableMetrics = useSelect( ( select ) => {
		const metrics = select( CORE_USER ).getKeyMetrics();

		if ( ! Array.isArray( metrics ) ) {
			return [];
		}

		const { isKeyMetricAvailable } = select( CORE_USER );

		return metrics.filter( isKeyMetricAvailable );
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { setValue } = useDispatch( CORE_UI );

	const onSideSheetOpen = useCallback( () => {
		setValues( KEY_METRICS_SELECTION_FORM, {
			[ KEY_METRICS_SELECTED ]: savedViewableMetrics,
		} );
	}, [ savedViewableMetrics, setValues ] );

	const sideSheetCloseFn = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
	}, [ setValue ] );

	return (
		<SideSheet
			className="googlesitekit-km-selection-panel"
			isOpen={ isOpen }
			onOpen={ onSideSheetOpen }
			closeFn={ sideSheetCloseFn }
			focusTrapOptions={ {
				initialFocus: '.googlesitekit-accordion__header',
			} }
		>
			<Header />
			<Metrics savedMetrics={ savedViewableMetrics } />
			<Footer savedMetrics={ savedViewableMetrics } />
		</SideSheet>
	);
}
