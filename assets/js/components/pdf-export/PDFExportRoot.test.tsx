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
import { DAY_IN_SECONDS } from '@/js/util';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import { createTestRegistry, render } from '@tests/js/test-utils';
import {
	PDF_EXPORT_DOWNLOADED_ITEM_SLUG,
	PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID,
	PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
} from './constants';
import PDFExportRoot from './PDFExportRoot';
import { expectSurveyTriggerFetch, setupSurveyTriggerTest } from './test-utils';

describe( 'PDFExportRoot', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'sends the survey trigger for a user who downloaded a PDF report', async () => {
		setupSurveyTriggerTest( registry, [
			PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
			PDF_EXPORT_DOWNLOADED_ITEM_SLUG,
		] );

		render( <PDFExportRoot />, { registry } );

		await expectSurveyTriggerFetch(
			PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID,
			DAY_IN_SECONDS
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint );
	} );
} );
