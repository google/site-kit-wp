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
} from '@tests/js/test-utils';
import IntentRenderer from './IntentRenderer';

jest.mock( '@/js/components/DashboardMainApp', () =>
	mockCreateComponent( 'DashboardMainApp' )
);

const TestIntent: FC< IntentComponentProps > = ( {
	slug,
	intentCode,
	payload,
	error,
} ) => (
	<p>
		Test intent { slug } with code { intentCode } and{ ' ' }
		{ error
			? `error ${ error.code }`
			: `payload ${ JSON.stringify( payload ) }` }
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

	it( 'renders the main dashboard and sends no intent request when no component is registered for the slug', async () => {
		const { getByText, waitForRegistry } = render(
			<IntentRenderer slug="unregistered-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
		await waitForRegistry();

		expect(
			getByText( 'DashboardMainApp', { exact: false } )
		).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( intentEndpoint );
	} );

	it( 'renders the help menu inside the Site Kit header when a component is registered for the slug', async () => {
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
			container.querySelector(
				'.googlesitekit-header .googlesitekit-help-menu__button'
			)
		).toBeInTheDocument();
	} );

	it( 'shows a progress bar and no intent component while the intent loads', async () => {
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

	it( 'renders the intent component with the slug, the intent code, and the payload when the intent request succeeds', async () => {
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
		expect( fetchMock ).toHaveFetchedTimes( 1, intentEndpoint, {
			query: { slug: 'test-intent', intent_code: 'abc123' },
		} );
		expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'should pass the error to the intent component, and show no error of its own, when the intent request fails', async () => {
		fetchMock.getOnce( intentEndpoint, {
			body: {
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			},
			status: 404,
		} );

		const { findByText, queryByRole } = render(
			<IntentRenderer slug="test-intent" intentCode="abc123" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect(
			await findByText(
				'Test intent test-intent with code abc123 and error intent_not_found'
			)
		).toBeInTheDocument();
		expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );
} );
