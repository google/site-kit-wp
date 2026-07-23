/**
 * PDFExportSurveyTriggers component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import { act, createTestRegistry, render, waitFor } from '@tests/js/test-utils';
import {
	PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID,
	PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID,
} from './constants';
import PDFExportSurveyTriggers from './PDFExportSurveyTriggers';
import {
	expectSurveyTriggerFetch,
	setPDFExportStatus,
	setupSurveyTriggerTest,
} from './test-utils';

describe( 'PDFExportSurveyTriggers', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	/**
	 * Clears the PDF export on the test registry, which returns the status to
	 * `'idle'`.
	 *
	 * The dashboard runs the same action when the user cancels an export, and
	 * when the success snackbar dismisses itself.
	 *
	 * @since 1.184.0
	 *
	 * @return {void}
	 */
	function clearExport() {
		act( () => {
			registry.dispatch( CORE_PDF ).clearExport();
		} );
	}

	/**
	 * Waits for a survey trigger's lock to clear.
	 *
	 * `triggerSurvey` locks a trigger ID while its request is in flight, and
	 * drops any dispatch for a locked ID. Waiting for the lock first proves the
	 * transition check stopped the second survey, and not the lock.
	 *
	 * @since 1.184.0
	 *
	 * @param triggerID The locked survey trigger ID, such as `'pdf_export_success'`.
	 * @return A promise that resolves once the lock clears.
	 */
	function waitForSurveyTriggerLockToClear( triggerID: string ) {
		return waitFor( () =>
			expect(
				registry.select( CORE_USER ).isSurveyTriggerLocked( triggerID )
			).toBe( false )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		setupSurveyTriggerTest( registry );
	} );

	it( 'fires the export-error survey trigger when the export fails', async () => {
		render( <PDFExportSurveyTriggers />, { registry } );

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'error' );

		await expectSurveyTriggerFetch( PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID );

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'fires the download-success survey trigger when the export completes and the download starts', async () => {
		render( <PDFExportSurveyTriggers />, { registry } );

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'success' );

		await expectSurveyTriggerFetch( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'fires no survey trigger when the user cancels the export', async () => {
		const { waitForRegistry } = render( <PDFExportSurveyTriggers />, {
			registry,
		} );

		// A cancelled PDF export never reaches the error status: the orchestrator
		// returns to its idle stage and clears the export instead.
		setPDFExportStatus( registry, 'progress' );
		clearExport();

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 0, surveyTriggerEndpoint );
	} );

	it( 'fires no survey trigger while the export is idle or in progress', async () => {
		const { waitForRegistry } = render( <PDFExportSurveyTriggers />, {
			registry,
		} );

		expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );

		setPDFExportStatus( registry, 'progress' );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 0, surveyTriggerEndpoint );
	} );

	it( 'fires the survey trigger once per export, and not again while the success snackbar stays on screen', async () => {
		const { rerender, waitForRegistry } = render(
			<PDFExportSurveyTriggers />,
			{ registry }
		);

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'success' );

		await expectSurveyTriggerFetch( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );
		await waitForSurveyTriggerLockToClear(
			PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );

		// The success snackbar stays on screen for several seconds after the PDF
		// export finishes, so the dashboard re-renders while the status still
		// reads `'success'`.
		rerender( <PDFExportSurveyTriggers /> );
		rerender( <PDFExportSurveyTriggers /> );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'fires the survey trigger again for a second export in the same page load', async () => {
		render( <PDFExportSurveyTriggers />, { registry } );

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'success' );

		await expectSurveyTriggerFetch( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );
		await waitForSurveyTriggerLockToClear(
			PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );

		// The success snackbar dismisses itself, which returns the status to
		// `'idle'` and leaves the component ready for the next export.
		clearExport();
		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'success' );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 2, surveyTriggerEndpoint )
		);
	} );
} );
