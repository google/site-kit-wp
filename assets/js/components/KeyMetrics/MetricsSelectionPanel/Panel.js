/**
 * Selection Panel
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
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	EFFECTIVE_SELECTION,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/components/KeyMetrics/constants';
import PanelContent from './PanelContent';
import SelectionPanel from '@/js/components/SelectionPanel';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';

export default function Panel() {
	const viewContext = useViewContext();
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);
	const savedViewableMetrics = useInViewSelect( ( select ) => {
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
			[ EFFECTIVE_SELECTION ]: savedViewableMetrics,
		} );
		trackEvent( `${ viewContext }_kmw-sidebar`, 'metrics_sidebar_view' );
	}, [ savedViewableMetrics, setValues, viewContext ] );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ setValue, isOpen ] );

	const [ isNavigatingToOAuthURL, setIsNavigatingToOAuthURL ] =
		useState( false );

	return (
		<SelectionPanel
			isOpen={ isOpen || isNavigatingToOAuthURL }
			onOpen={ onSideSheetOpen }
			closePanel={ closePanel }
			className="googlesitekit-km-selection-panel googlesitekit-acr-km-selection-panel"
		>
			<PanelContent
				isOpen={ isOpen }
				closePanel={ closePanel }
				savedViewableMetrics={ savedViewableMetrics }
				setIsNavigatingToOAuthURL={ setIsNavigatingToOAuthURL }
			/>
		</SelectionPanel>
	);
}
