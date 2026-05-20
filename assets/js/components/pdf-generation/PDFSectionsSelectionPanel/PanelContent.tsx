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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import Header from './Header';
import Footer from './Footer';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';
import PDFGeneratingNotice from './PDFGeneratingNotice';

interface PanelContentProps {
	closePanel: () => void;
}

const PanelContent: FC< PanelContentProps > = ( { closePanel } ) => {
	const selectedSections = useSelect(
		( select: Select ) =>
			select( CORE_PDF ).getSectionsSelection() as string[],
		[]
	);

	const { toggleSectionsSelectionItem } = useDispatch( CORE_PDF );

	const toggleSection = useCallback(
		( slug: string ) => {
			toggleSectionsSelectionItem( slug );
		},
		[ toggleSectionsSelectionItem ]
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
