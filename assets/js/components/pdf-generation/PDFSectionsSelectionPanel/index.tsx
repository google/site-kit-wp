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
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import InViewProvider from '@/js/components/InViewProvider';
import {
	DEFAULT_SELECTED_SECTIONS,
	FORM_PDF_DOWNLOAD,
	FORM_PDF_DOWNLOAD_SELECTED_SECTIONS,
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_GENERATING_KEY,
} from '@/js/components/pdf-generation/constants';
import SelectionPanel from '@/js/components/SelectionPanel';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useFormValue from '@/js/hooks/useFormValue';
import PanelContent from './PanelContent';

const PDFSectionsSelectionPanel: FC = () => {
	const isOpen = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY ),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );
	const [ , setSelectedSections ] = useFormValue(
		FORM_PDF_DOWNLOAD,
		FORM_PDF_DOWNLOAD_SELECTED_SECTIONS
	);

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, false );
		}
	}, [ isOpen, setValue ] );

	const onSideSheetOpen = useCallback( () => {
		setSelectedSections( DEFAULT_SELECTED_SECTIONS );
		// Reset any stale "generating" state left over from a previous session.
		setValue( PDF_GENERATING_KEY, false );
	}, [ setSelectedSections, setValue ] );

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
