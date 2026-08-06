/**
 * PDF export test utility functions.
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
import { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';

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
	waitFor,
} from '@tests/js/test-utils';

/**
 * The title of the notice shown while a report is generating.
 *
 * @since n.e.x.t
 */
export const REPORT_GENERATING_NOTICE_TITLE = 'Your report is being generated';

/**
 * The text under the title of the notice shown while a report is generating.
 *
 * @since n.e.x.t
 */
export const REPORT_GENERATING_NOTICE_DESCRIPTION =
	'To create another report, please wait for the current download to complete.';

type Registry = ReturnType< typeof createTestRegistry >;

/**
 * Renders a PDF element to its JSON tree as a string.
 *
 * A style passed as an array and a prop on a `@react-pdf` primitive never reach
 * the rendered DOM, so an assertion on either one reads the JSON tree.
 *
 * @since n.e.x.t
 *
 * @param element The PDF element to render.
 * @return The rendered tree, as a JSON string.
 */
export function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

/**
 * Provides the site info, user authentication, and empty survey timeout list a
 * survey trigger needs, and mocks the trigger endpoint.
 *
 * @since 1.184.0
 *
 * @param  registry The test registry the component under test renders with.
 * @return {void}
 */
export function setupSurveyTriggerTest( registry: Registry ) {
	provideSiteInfo( registry );
	provideUserAuthentication( registry );
	registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

	fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
}

/**
 * Sets the PDF export status on the given registry, inside `act()`.
 *
 * @since 1.184.0
 *
 * @param  registry The test registry the component under test renders with.
 * @param  status   The PDF export status to set, such as `'progress'` or `'success'`.
 * @return {void}
 */
export function setPDFExportStatus( registry: Registry, status: PDFStatus ) {
	act( () => {
		registry.dispatch( CORE_PDF ).setStatus( status );
	} );
}

/**
 * Waits for the survey trigger endpoint to receive a request for the given
 * trigger ID.
 *
 * @since 1.184.0
 *
 * @param triggerID The survey trigger ID the request body holds, such as `'pdf_export_success'`.
 * @return A promise that resolves once the request lands, and rejects on timeout.
 */
export function expectSurveyTriggerFetch( triggerID: string ) {
	return waitFor( () =>
		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID } },
		} )
	);
}
