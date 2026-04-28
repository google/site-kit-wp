/**
 * PDF Generating Notice.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PDF_GENERATING_KEY } from '@/js/components/pdf-generation/constants';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import { TYPES } from '@/js/components/Notice/constants';

export default function PDFGeneratingNotice() {
	const isGenerating = useSelect( ( select ) =>
		select( CORE_UI ).getValue( PDF_GENERATING_KEY )
	);

	if ( ! isGenerating ) {
		return null;
	}

	return (
		<SelectionPanelNotice
			className="googlesitekit-notice--side-panel googlesitekit-pdf-download-panel__notice"
			type={ TYPES.WARNING }
			title={ __( 'Your report is being generated', 'google-site-kit' ) }
			description={ __(
				'To create another report, please wait for the current download to complete.',
				'google-site-kit'
			) }
			hideIcon
		/>
	);
}
