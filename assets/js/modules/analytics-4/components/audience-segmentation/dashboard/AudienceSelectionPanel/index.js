/**
 * Audience Selection Panel
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import AudienceItems from './AudienceItems';
import Header from './Header';
import SelectionPanel from '../../../../../../components/SelectionPanel';
import { useCallback } from '@wordpress/element';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';

const { useSelect, useDispatch } = Data;

export default function AudienceSelectionPanel() {
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
	);
	const savedItemSlugs = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { setValue } = useDispatch( CORE_UI );

	const onSideSheetOpen = useCallback( () => {
		setValues( AUDIENCE_SELECTION_FORM, {
			[ AUDIENCE_SELECTED ]: savedItemSlugs,
		} );
	}, [ savedItemSlugs, setValues ] );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, false );
		}
	}, [ setValue, isOpen ] );

	return (
		<SelectionPanel
			closePanel={ closePanel }
			isOpen={ isOpen }
			onOpen={ onSideSheetOpen }
		>
			<Header closePanel={ closePanel } />
			<AudienceItems />
		</SelectionPanel>
	);
}
