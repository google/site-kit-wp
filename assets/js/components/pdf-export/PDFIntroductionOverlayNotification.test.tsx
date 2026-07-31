/**
 * PDFIntroductionOverlayNotification component tests.
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
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Notifications from '@/js/components/notifications/Notifications';
import {
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_INTRODUCTION_OVERLAY_NOTIFICATION,
} from '@/js/components/pdf-export/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { mockSurveyEndpoints } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';

const fetchDismissItem = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);
const fetchGetDismissedItems = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

describe( 'PDFIntroductionOverlayNotification', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ PDF_INTRODUCTION_OVERLAY_NOTIFICATION ];

	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				PDF_INTRODUCTION_OVERLAY_NOTIFICATION,
				notification
			);
	} );

	afterEach( () => {
		fetchMock.reset();
	} );

	function renderNotifications() {
		return render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'pdfGeneration' ],
			}
		);
	}

	it( 'renders the introduction content', async () => {
		mockSurveyEndpoints();

		const { getByText, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		expect( getByText( 'Export to PDF' ) ).toBeInTheDocument();
		expect(
			getByText(
				'You can now create a custom report featuring current metrics from your dashboard'
			)
		).toBeInTheDocument();
	} );

	it( 'dismisses the notification when the Got it button is clicked', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ PDF_INTRODUCTION_OVERLAY_NOTIFICATION ],
		} );
		mockSurveyEndpoints();

		const { getByRole, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /got it/i } ) );
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				fetchDismissItem,
				expect.objectContaining( {
					body: {
						data: {
							slug: PDF_INTRODUCTION_OVERLAY_NOTIFICATION,
							expiration: 0,
						},
					},
				} )
			)
		);
	} );

	it( 'opens the PDF download panel and dismisses the notification when the Try it button is clicked', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ PDF_INTRODUCTION_OVERLAY_NOTIFICATION ],
		} );
		mockSurveyEndpoints();

		const { getByRole, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /try it/i } ) );
		} );

		expect(
			registry.select( CORE_UI ).getValue( PDF_DOWNLOAD_PANEL_OPENED_KEY )
		).toBe( true );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( fetchDismissItem )
		);
	} );

	it( 'does not render once dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				PDF_INTRODUCTION_OVERLAY_NOTIFICATION,
			] );

		const { queryByText, waitForRegistry } = renderNotifications();

		await waitForRegistry();

		expect( queryByText( 'Export to PDF' ) ).not.toBeInTheDocument();
	} );
} );
