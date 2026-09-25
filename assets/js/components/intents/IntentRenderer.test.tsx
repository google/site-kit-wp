/**
 * IntentRenderer tests.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import Intents from 'googlesitekit-intents';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { IntentComponentProps } from '@/js/googlesitekit/intents';
import { mockCreateComponent } from '@tests/js/mock-component-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	within,
} from '@tests/js/test-utils';
import IntentRenderer from './IntentRenderer';

jest.mock( '@/js/components/DashboardMainApp', () =>
	mockCreateComponent( 'DashboardMainApp' )
);

const TestIntent: FC< IntentComponentProps > = ( {
	slug,
	intentCode,
	payload,
} ) => (
	<p>
		Test intent { slug } with code { intentCode } and payload{ ' ' }
		{ JSON.stringify( payload ) }
	</p>
);

describe( 'IntentRenderer', () => {
	const intentEndpoint = new RegExp(
		'^/google-site-kit/v1/core/intents/data/intent'
	);

	let registry: WPDataRegistry;

	beforeAll( () => {
		Intents.registerIntent( 'test-intent', { Component: TestIntent } );
	} );

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );
		provideUserAuthentication( registry );

		registry.dispatch( CORE_SITE ).receiveGetNotifications( [] );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
	} );

	it( 'renders the main dashboard and requests no intent when no component is registered for the slug', async () => {
		const { getByText, waitForRegistry } = render(
			<IntentRenderer slug="unregistered-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
		await waitForRegistry();

		expect( getByText( /DashboardMainApp/ ) ).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( intentEndpoint );
	} );

	it( 'renders the Site Kit header with the help menu', async () => {
		freezeFetch( intentEndpoint );

		const { container, waitForRegistry } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-help-menu__button' )
		).toBeInTheDocument();
	} );

	it( 'shows a progress bar, and not the registered component, while the intent loads', async () => {
		freezeFetch( intentEndpoint );

		const { getByRole, queryByText, waitForRegistry } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
		await waitForRegistry();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Test intent', { exact: false } )
		).not.toBeInTheDocument();
	} );

	it( 'requests the intent for the slug and the intent code, and renders the registered component with the slug, the intent code, and the payload', async () => {
		fetchMock.getOnce( intentEndpoint, {
			body: {
				intent: 'test-intent',
				created: '2026-07-30T10:15:00Z',
				payload: {
					tag_id: 'AW-123456789',
					customer_name: 'Example Store',
				},
			},
		} );

		const { findByText, queryByRole } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect(
			await findByText(
				'Test intent test-intent with code abc123 and payload {"tag_id":"AW-123456789","customer_name":"Example Store"}'
			)
		).toBeInTheDocument();
		expect( fetchMock ).toHaveFetched( intentEndpoint, {
			query: { slug: 'test-intent', intent_code: 'abc123' },
		} );
		expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the "We couldn’t load your request" error notice with a "Go to dashboard" button when the intent request returns `intent_not_found`', async () => {
		fetchMock.getOnce( intentEndpoint, {
			body: {
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			},
			status: 404,
		} );

		const { findByRole, queryByRole, queryByText } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const notice = await findByRole( 'status' );

		expect( notice ).toHaveClass( 'googlesitekit-notice--error' );
		expect(
			within( notice ).getByText( 'We couldn’t load your request' )
		).toBeInTheDocument();
		expect(
			within( notice ).getByText(
				'The link may already have been used, or it may have expired. You can start again from the Google Ads console.'
			)
		).toBeInTheDocument();
		expect(
			within( notice ).getByRole( 'button', { name: 'Go to dashboard' } )
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
		expect( within( notice ).getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect(
			queryByText(
				'This link can’t be used. Go back to where you started and try again.'
			)
		).not.toBeInTheDocument();
		expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'Test intent', { exact: false } )
		).not.toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'shows the "We couldn’t load your request" error notice when the user has no Google account connected to Site Kit', async () => {
		fetchMock.getOnce( intentEndpoint, {
			body: {
				code: 'intent_user_not_connected',
				message:
					'Your Google account isn’t connected to Site Kit. Connect Site Kit with your Google account, then try again.',
				data: { status: 403 },
			},
			status: 403,
		} );

		const { findByRole, queryByText } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const notice = await findByRole( 'status' );

		expect( notice ).toHaveClass( 'googlesitekit-notice--error' );
		expect(
			within( notice ).getByText( 'We couldn’t load your request' )
		).toBeInTheDocument();
		expect(
			within( notice ).getByText(
				'The link may already have been used, or it may have expired. You can start again from the Google Ads console.'
			)
		).toBeInTheDocument();
		expect(
			within( notice ).getByRole( 'button', { name: 'Go to dashboard' } )
		).toBeInTheDocument();
		expect( within( notice ).getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect(
			queryByText(
				'Your Google account isn’t connected to Site Kit. Connect Site Kit with your Google account, then try again.'
			)
		).not.toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'shows the "We couldn’t load your request" error notice when the intent request fails with a server error', async () => {
		fetchMock.getOnce( intentEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { findByRole } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const notice = await findByRole( 'status' );

		expect( notice ).toHaveClass( 'googlesitekit-notice--error' );
		expect(
			within( notice ).getByText( 'We couldn’t load your request' )
		).toBeInTheDocument();
		expect(
			within( notice ).getByText(
				'The link may already have been used, or it may have expired. You can start again from the Google Ads console.'
			)
		).toBeInTheDocument();
		expect(
			within( notice ).getByRole( 'button', { name: 'Go to dashboard' } )
		).toBeInTheDocument();
		expect( within( notice ).getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect( console ).toHaveErrored();
	} );
} );
