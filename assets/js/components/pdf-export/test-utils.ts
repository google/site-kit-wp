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
 * @since n.e.x.t Added the `dismissedItems` parameter.
 *
 * @param  registry       The test registry the component under test renders with.
 * @param  dismissedItems The slugs already in WordPress user meta. They pick one of the three PDF export surveys.
 * @return {void}
 */
export function setupSurveyTriggerTest(
	registry: Registry,
	dismissedItems: string[] = []
) {
	provideSiteInfo( registry );
	provideUserAuthentication( registry );
	registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( dismissedItems );

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
 * trigger ID and time to live.
 *
 * @since 1.184.0
 * @since n.e.x.t Added the `ttl` parameter.
 *
 * @param triggerID The survey trigger ID the request body holds, such as `'view_pdf_export_downloaded'`.
 * @param ttl       The seconds the survey service waits before it offers the same survey again.
 * @return A promise that resolves once the request lands, and rejects on timeout.
 */
export function expectSurveyTriggerFetch( triggerID: string, ttl: number ) {
	return waitFor( () =>
		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID, ttl } },
		} )
	);
}

/**
 * Collects every text string in a `react-test-renderer` tree, so a test can
 * assert on rendered copy without walking the tree itself.
 *
 * @since n.e.x.t
 *
 * @param node A tree's root, a child node, or a leaf, as returned by
 *             `TestRenderer.create( element ).toJSON()`.
 * @return The collected text strings, in render order.
 */
export function findTextStrings(
	node:
		| string
		| number
		| TestRenderer.ReactTestRendererJSON
		| null
		| undefined
): string[] {
	if ( node === null || node === undefined ) {
		return [];
	}
	if ( typeof node === 'string' ) {
		return [ node ];
	}
	if ( typeof node === 'number' ) {
		return [ String( node ) ];
	}
	if ( ! Array.isArray( node.children ) ) {
		return [];
	}
	return node.children.flatMap( ( child ) => findTextStrings( child ) );
}
