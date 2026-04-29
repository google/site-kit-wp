/**
 * PDF Sections Selection Panel Content.
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import {
	DEFAULT_SELECTED_SECTIONS,
	FORM_PDF_DOWNLOAD,
	FORM_PDF_DOWNLOAD_SELECTED_SECTIONS,
} from '@/js/components/pdf-generation/constants';
import useFormValue from '@/js/hooks/useFormValue';
import Header from './Header';
import Footer from './Footer';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';
import PDFGeneratingNotice from './PDFGeneratingNotice';
import SelectAtLeastOneSectionNotice from './SelectAtLeastOneSectionNotice';

interface PanelContentProps {
	closePanel: () => void;
}

export default function PanelContent( { closePanel }: PanelContentProps ) {
	const selectedSections =
		( useFormValue(
			FORM_PDF_DOWNLOAD,
			FORM_PDF_DOWNLOAD_SELECTED_SECTIONS
		) as string[] | undefined ) ?? DEFAULT_SELECTED_SECTIONS;

	const { setValues } = useDispatch( CORE_FORMS );

	const toggleSection = useCallback(
		( slug: string ) => {
			const nextSelection = selectedSections.includes( slug )
				? selectedSections.filter( ( item ) => item !== slug )
				: [ ...selectedSections, slug ];

			setValues( FORM_PDF_DOWNLOAD, {
				[ FORM_PDF_DOWNLOAD_SELECTED_SECTIONS ]: nextSelection,
			} );
		},
		[ selectedSections, setValues ]
	);

	const hasSelection = selectedSections.length > 0;

	return (
		<Fragment>
			<Header closePanel={ closePanel } />
			<SelectionPanelContent className="googlesitekit-pdf-download-panel__content">
				<PDFSectionCheckboxes
					selectedSections={ selectedSections }
					toggleSection={ toggleSection }
				/>
			</SelectionPanelContent>
			{ ! hasSelection && <SelectAtLeastOneSectionNotice /> }
			<PDFGeneratingNotice />
			<Footer closePanel={ closePanel } hasSelection={ hasSelection } />
		</Fragment>
	);
}
