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
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../constants';
import InViewProvider from '../../InViewProvider';
import Panel from './Panel';

export default function MetricsSelectionPanel() {
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);

	const [ inViewState, setInViewState ] = useState( {
		key: 'MetricsSelectionPanel',
		value: !! isOpen,
	} );

	useEffect( () => {
		setInViewState( {
			key: 'WPDashboardApp',
			value: !! isOpen,
		} );
	}, [ isOpen ] );

	return (
		<InViewProvider value={ inViewState }>
			<Panel />
		</InViewProvider>
	);
}
