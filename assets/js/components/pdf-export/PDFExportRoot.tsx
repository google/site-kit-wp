/**
 * PDF export root: hosts the report snackbars and gates the orchestrator mount.
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
import { Fragment, Suspense, lazy, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import PDFReportSnackbarHost from './PDFReportSnackbarHost';

const PDFExportOrchestrator = lazy(
	() =>
		import(
			/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
			'./PDFExportOrchestrator'
		)
);

const PDFExportRoot: FC = () => {
	const isExporting = useSelect(
		( select: Select ) => select( CORE_PDF ).isExporting(),
		[]
	);

	const { finishExporting } = useDispatch( CORE_PDF );
	const { setValue } = useDispatch( CORE_UI );

	// Re-opens the side sheet panel (the same panel toggled by the dashboard
	// header's download icon button) so the user can retry the export with
	// their previous selection preserved.
	const openPanel = useCallback( () => {
		setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	return (
		<Fragment>
			<PDFReportSnackbarHost onRetry={ openPanel } />
			{ isExporting && (
				<Suspense fallback={ null }>
					<PDFExportOrchestrator onComplete={ finishExporting } />
				</Suspense>
			) }
		</Fragment>
	);
};

export default PDFExportRoot;
