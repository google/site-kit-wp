/**
 * Selection Panel
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from '../constants';
import CustomDimensionsNotice from './CustomDimensionsNotice';
import Header from './Header';
import Footer from './Footer';
import MetricItems from './MetricItems';
import SelectionPanel from '../../SelectionPanel';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';
import { useFeature } from '../../../hooks/useFeature';

export default function Panel() {
	const viewContext = useViewContext();
	const isConversionReportingEnabled = useFeature( 'conversionReporting' );
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
			className={ classnames( 'googlesitekit-km-selection-panel', {
				'googlesitekit-acr-km-selection-panel':
					isConversionReportingEnabled,
			} ) }
		>
			<Header closePanel={ closePanel } />
			<MetricItems savedMetrics={ savedViewableMetrics } />
			<CustomDimensionsNotice />
			<Footer
				isOpen={ isOpen }
				closePanel={ closePanel }
				savedMetrics={ savedViewableMetrics }
				onNavigationToOAuthURL={ () => {
					setIsNavigatingToOAuthURL( true );
				} }
			/>
		</SelectionPanel>
	);
}
