/**
 * PDF Sections Selection Panel (container around SelectionPanel)
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import InViewProvider from '@/js/components/InViewProvider';
import SelectionPanel from '@/js/components/SelectionPanel';
import PanelContent from './PanelContent';
import {
	PDF_GENERATING_KEY,
	DEFAULT_SELECTED_SECTIONS,
} from '@/js/components/pdf-generation/constants';

const PDFSectionsSelectionPanel: FC = () => {
	const isOpen = useSelect(
		( select: Select ) => select( CORE_PDF ).isSectionsPanelOpen(),
		[]
	);

	const { closeSectionsPanel, setSectionsSelectedItems } =
		useDispatch( CORE_PDF );
	const { setValue } = useDispatch( CORE_UI );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			closeSectionsPanel();
		}
	}, [ isOpen, closeSectionsPanel ] );

	const onSideSheetOpen = useCallback( () => {
		setSectionsSelectedItems( DEFAULT_SELECTED_SECTIONS );
		// Reset any stale "generating" state left over from a previous session.
		// PDF_GENERATING_KEY is a temporary CORE_UI stub that will be replaced
		// by the orchestrator in #12537.
		setValue( PDF_GENERATING_KEY, false );
	}, [ setSectionsSelectedItems, setValue ] );

	return (
		<InViewProvider
			// @ts-expect-error - The `InViewProvider` component value prop is currently typed as `boolean` only.
			value={ {
				key: 'PDFSectionsSelectionPanel',
				value: !! isOpen,
			} }
		>
			<SelectionPanel
				className="googlesitekit-pdf-download-panel"
				isOpen={ !! isOpen }
				onOpen={ onSideSheetOpen }
				closePanel={ closePanel }
			>
				<PanelContent closePanel={ closePanel } />
			</SelectionPanel>
		</InViewProvider>
	);
};

export default PDFSectionsSelectionPanel;
