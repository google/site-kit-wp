/**
 * PDFExportRoot component tests.
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
 * Internal dependencies
 */
import { createTestRegistry, render } from '@tests/js/test-utils';
import {
	PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID,
	PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID,
} from './constants';
import PDFExportRoot from './PDFExportRoot';
import {
	expectSurveyTriggerFetch,
	setPDFExportStatus,
	setupSurveyTriggerTest,
} from './test-utils';

describe( 'PDFExportRoot', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		setupSurveyTriggerTest( registry );
	} );

	// The orchestrator that runs the PDF export unmounts once the export
	// finishes, so the root hosts the survey triggers instead.
	it( 'fires the download-success survey trigger when an export completes and the download starts', async () => {
		render( <PDFExportRoot />, { registry } );

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'success' );

		await expectSurveyTriggerFetch( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );
	} );

	it( 'fires the export-error survey trigger when an export fails', async () => {
		render( <PDFExportRoot />, { registry } );

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'error' );

		await expectSurveyTriggerFetch( PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID );
	} );
} );
