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
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import InViewProvider from '@/js/components/InViewProvider';
import {
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
} from '@/js/components/pdf-export/constants';
import SelectionPanel from '@/js/components/SelectionPanel';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import PanelContent from './PanelContent';

const PDFSectionsSelectionPanel: FC = () => {
	const isOpen = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY ),
		[]
	);
	const hasAlreadyOpenedPDFExportPanel = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				PDF_EXPORT_PANEL_OPENED_ITEM_SLUG
			),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );
	const { dismissItem } = useDispatch( CORE_USER );
	const viewContext = useViewContext();
	const viewEventFiredRef = useRef( false );
	const panelOpenedItemDismissedRef = useRef( false );

	useEffect( () => {
		if ( isOpen && ! viewEventFiredRef.current ) {
			viewEventFiredRef.current = true;
			trackEvent(
				`${ viewContext }_pdf_generation_section_selection-sidebar`,
				'pdf_generation_sidebar_view'
			);
		}
		if ( ! isOpen ) {
			viewEventFiredRef.current = false;
		}
	}, [ isOpen, viewContext ] );

	useEffect( () => {
		// `dismissItem` saves `pdf-export-panel-opened` in WordPress user meta,
		// and `hasAlreadyOpenedPDFExportPanel` keeps reading `false` until that
		// save finishes. Without `panelOpenedItemDismissedRef`, a user who
		// reopens the panel during the save would start a second one.
		if (
			isOpen &&
			hasAlreadyOpenedPDFExportPanel === false &&
			! panelOpenedItemDismissedRef.current
		) {
			panelOpenedItemDismissedRef.current = true;
			dismissItem( PDF_EXPORT_PANEL_OPENED_ITEM_SLUG );
		}
	}, [ isOpen, hasAlreadyOpenedPDFExportPanel, dismissItem ] );

	const closePanel = useCallback( () => {
		if ( isOpen ) {
			trackEvent(
				`${ viewContext }_pdf_generation_section_selection-sidebar`,
				'pdf_generation_sidebar_close'
			);
			setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, false );
		}
	}, [ isOpen, setValue, viewContext ] );

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
				closePanel={ closePanel }
			>
				<PanelContent closePanel={ closePanel } />
			</SelectionPanel>
		</InViewProvider>
	);
};

export default PDFSectionsSelectionPanel;
