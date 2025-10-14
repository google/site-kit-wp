/**
 * EmailReportingCardNotice component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import EmailReportingCardNotice, {
	EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM,
} from './EmailReportingCardNotice';
import {
	createTestRegistry,
	render,
	fireEvent,
	freezeFetch,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/proactive-user-engagement/constants';

describe( 'EmailReportingCardNotice', () => {
	let registry;

	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);
	const fetchGetDismissedItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.reset();
	} );

	it( 'renders the notice when user is not subscribed and not dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( { subscribed: false } );

		const { getByText } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		// Title and description should be present.
		expect(
			getByText( /Get site insights in your inbox/i )
		).toBeInTheDocument();
		expect(
			getByText(
				/Receive the most important insights about your site's performance/i
			)
		).toBeInTheDocument();
	} );

	it( 'opens selection panel when "Set up" is clicked', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( { subscribed: false } );

		const { getByRole } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		fireEvent.click( getByRole( 'button', { name: /set up/i } ) );

		// Check CORE_UI value is set to true.
		expect(
			registry
				.select( CORE_UI )
				.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );

	it( 'dismisses the notice when "Maybe later" is clicked', async () => {
		// Mock dismissed item POST.
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM ],
		} );

		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( { subscribed: false } );

		const { getByRole } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( fetchDismissItem )
		);
	} );

	it( 'does not render when user is already subscribed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( {
				subscribed: true,
			} );

		const { container } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when notice is dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM,
			] );

		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( { subscribed: false } );

		const { container } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render while proactive settings are unresolved', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/core/user/data/proactive-user-engagement-settings'
			)
		);

		const { container } = render( <EmailReportingCardNotice />, {
			registry,
			features: [ 'proactiveUserEngagement' ],
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
