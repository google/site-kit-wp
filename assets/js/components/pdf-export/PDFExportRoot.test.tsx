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
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { PDFStatus } from '@/js/googlesitekit/datastore/pdf/pdf';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID,
	PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID,
} from './constants';
import PDFExportRoot from './PDFExportRoot';

describe( 'PDFExportRoot', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	/**
	 * Sets the PDF export status on the test registry.
	 *
	 * The dispatch runs inside `act()`, so React finishes the re-render before
	 * the test reads the result.
	 *
	 * @since n.e.x.t
	 *
	 * @param  status The PDF export status to set, such as `'progress'` or `'success'`.
	 * @return {void}
	 */
	function setStatus( status: PDFStatus ) {
		act( () => {
			registry.dispatch( CORE_PDF ).setStatus( status );
		} );
	}

	/**
	 * Waits for the survey trigger endpoint to receive one request for a survey.
	 *
	 * @since n.e.x.t
	 *
	 * @param triggerID The survey trigger ID the request body holds, such as `'pdf_export_success'`.
	 * @return A promise that resolves once the request lands, and rejects on timeout.
	 */
	function expectSurveyTriggerFetch( triggerID: string ) {
		return waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: { data: { triggerID } },
			} )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
	} );

	// The root is the always-mounted host for the survey triggers. The
	// orchestrator that runs the PDF export unmounts once the export finishes,
	// so only the root is still mounted when the export reaches its outcome.
	it( 'fires the download-success survey trigger when an export completes and the download starts', async () => {
		render( <PDFExportRoot />, { registry } );

		setStatus( 'progress' );
		setStatus( 'success' );

		await expectSurveyTriggerFetch( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );
	} );

	it( 'fires the export-error survey trigger when an export fails', async () => {
		render( <PDFExportRoot />, { registry } );

		setStatus( 'progress' );
		setStatus( 'error' );

		await expectSurveyTriggerFetch( PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID );
	} );
} );
