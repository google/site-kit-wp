/**
 * Dashboard surveys test.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	enableFeature,
	setupSiteKit,
	useRequestInterception,
} from '../../utils';
import surveyResponse from '../../../../assets/js/components/surveys/__fixtures__/survey-single-question.json';

describe( 'dashboard surveys', () => {
	beforeAll( async () => {
		await setupSiteKit();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();

			// The survey endpoint is stubbed on the server to always return a null survey
			// so we will intercept it on the client (see e2e-rest-survey-trigger.php).
			if ( url.match( 'user/data/survey-trigger' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( surveyResponse ),
				} );
			} else if (
				url.match( 'user/data/survey-event' ) ||
				url.match( 'user/data/survey-timeout' )
			) {
				request.respond( { status: 200 } );
			} else if (
				url.match( 'search-console/data/searchanalytics' ) ||
				url.match( 'user/data/survey-timeouts' )
			) {
				request.respond( { status: 200, body: '[]' } );
			} else if ( url.match( 'pagespeed-insights/data/pagespeed' ) ) {
				request.respond( { status: 200, body: '{}' } );
			} else {
				request.continue();
			}
		} );
	} );

	it( 'shows a survey', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toMatchElement( '.googlesitekit-survey', {
			text: surveyResponse.survey_payload.question[ 0 ].question_text,
		} );
	} );

	it( 'shows a survey on the unified dashboard', async () => {
		await enableFeature( 'unifiedDashboard' );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toMatchElement( '.googlesitekit-survey', {
			text: surveyResponse.survey_payload.question[ 0 ].question_text,
		} );
	} );
} );
