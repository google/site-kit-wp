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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import {
	PDF_EXPORT_DOWNLOADED_ITEM_SLUG,
	PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID,
	PDF_EXPORT_INCOMPLETE_SURVEY_TRIGGER_ID,
	PDF_EXPORT_NOT_USED_SURVEY_TRIGGER_ID,
	PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
} from './constants';
import PDFExportSurveyTriggers from './PDFExportSurveyTriggers';
import {
	dismissedItemsEndpoint,
	expectSurveyTriggerFetch,
	setPDFExportStatus,
	setupSurveyTriggerTest,
} from './test-utils';

describe( 'PDFExportSurveyTriggers', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	/**
	 * Renders the component for a user who already has the given slugs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string[]} dismissedItems The slugs already in WordPress user meta. They pick one of the three PDF export surveys.
	 * @return {Object} The render result for the component.
	 */
	function renderWithSavedSlugs( dismissedItems: string[] ) {
		setupSurveyTriggerTest( registry, dismissedItems );

		return render( <PDFExportSurveyTriggers />, { registry } );
	}

	it( 'sends the survey trigger for a user who never opened the PDF export panel', async () => {
		renderWithSavedSlugs( [] );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_NOT_USED_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'sends the survey trigger for a user who opened the PDF export panel and downloaded no report', async () => {
		renderWithSavedSlugs( [ PDF_EXPORT_PANEL_OPENED_ITEM_SLUG ] );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_INCOMPLETE_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'sends the survey trigger for a user who downloaded a PDF report', async () => {
		renderWithSavedSlugs( [
			PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
			PDF_EXPORT_DOWNLOADED_ITEM_SLUG,
		] );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'sends no survey trigger while the saved slugs are still loading', async () => {
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		// This promise never resolves, and the request for the saved slugs
		// never finishes.
		fetchMock.get( dismissedItemsEndpoint, new Promise( () => {} ) );

		const { waitForRegistry } = render( <PDFExportSurveyTriggers />, {
			registry,
		} );

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'sends no second survey trigger when the user opens the PDF export panel on the same page', async () => {
		const { waitForRegistry } = renderWithSavedSlugs( [] );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_NOT_USED_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		act( () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
				] );
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );

	it( 'sends no second survey trigger when an export starts, stops, fails, or finishes', async () => {
		const { waitForRegistry } = renderWithSavedSlugs( [
			PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
		] );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_INCOMPLETE_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'idle' );
		setPDFExportStatus( registry, 'progress' );
		setPDFExportStatus( registry, 'error' );
		setPDFExportStatus( registry, 'success' );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );
} );
