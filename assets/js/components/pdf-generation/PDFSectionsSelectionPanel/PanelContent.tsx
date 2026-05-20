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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import {
	DEFAULT_SELECTED_SECTIONS,
	FORM_PDF_DOWNLOAD,
	FORM_PDF_DOWNLOAD_SELECTED_SECTIONS,
} from '@/js/components/pdf-generation/constants';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import useFormValue from '@/js/hooks/useFormValue';
import Footer from './Footer';
import Header from './Header';
import PDFGeneratingNotice from './PDFGeneratingNotice';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

interface PanelContentProps {
	closePanel: () => void;
}

const PanelContent: FC< PanelContentProps > = ( { closePanel } ) => {
	const [ selectedSectionsValue, setSelectedSections ] = useFormValue(
		FORM_PDF_DOWNLOAD,
		FORM_PDF_DOWNLOAD_SELECTED_SECTIONS
	);
	const selectedSections =
		( selectedSectionsValue as string[] | undefined ) ??
		DEFAULT_SELECTED_SECTIONS;

	const toggleSection = useCallback(
		( slug: string ) => {
			const nextSelection = selectedSections.includes( slug )
				? selectedSections.filter( ( item ) => item !== slug )
				: [ ...selectedSections, slug ];

			setSelectedSections( nextSelection );
		},
		[ selectedSections, setSelectedSections ]
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
			{ ! hasSelection && (
				<SelectionPanelNotice
					// @ts-expect-error - The `SelectionPanelNotice` component is not yet typed.
					className="googlesitekit-notice--side-panel googlesitekit-pdf-download-panel__notice"
					type={ NOTICE_TYPES.ERROR }
					description={ __(
						'Select at least 1 topic',
						'google-site-kit'
					) }
				/>
			) }
			<PDFGeneratingNotice />
			<Footer closePanel={ closePanel } hasSelection={ hasSelection } />
		</Fragment>
	);
};

export default PanelContent;
