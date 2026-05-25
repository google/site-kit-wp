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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { PDF_EXPORTING_KEY } from '@/js/components/pdf-generation/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import PDFExportOrchestrator from './PDFExportOrchestrator';
import PDFReportSnackbarHost from './PDFReportSnackbarHost';

/**
 * Hosts the report snackbars and conditionally mounts the orchestrator
 * when `PDF_EXPORTING_KEY` is set in `core/ui`.
 *
 * @since n.e.x.t
 *
 * @return React element containing the snackbar host and orchestrator.
 */
const PDFExportRoot: FC = () => {
	const isExporting = useSelect(
		( select: Select ) => select( CORE_UI ).getValue( PDF_EXPORTING_KEY ),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	function stopExport() {
		setValue( PDF_EXPORTING_KEY, false );
	}

	return (
		<Fragment>
			<PDFReportSnackbarHost />
			{ isExporting && (
				<PDFExportOrchestrator onComplete={ stopExport } />
			) }
		</Fragment>
	);
};

export default PDFExportRoot;
