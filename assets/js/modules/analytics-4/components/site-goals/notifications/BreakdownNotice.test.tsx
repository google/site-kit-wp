/**
 * Site Goals BreakdownNotice tests.
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { SITE_GOALS_BREAKDOWN_NOTICE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import BreakdownNotice from './BreakdownNotice';

describe( 'BreakdownNotice', () => {
	let registry: WPDataRegistry;

	// The notice is presentational: the parent supplies the copy. These are
	// test-controlled values, independent of the production copy.
	const noticeProps = {
		title: 'Break down performance',
		description: 'See the breakdown of your performance.',
		ctaLabel: 'Get breakdown',
	};

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions: [] } );

		// Default to the visible state: intro modal dismissed, breakdown
		// dimensions not created, notice not dismissed.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
	} );

	it( 'renders the parent-provided content when the intro modal is dismissed, dimensions are missing and the notice is not dismissed', () => {
		const { getByText } = render( <BreakdownNotice { ...noticeProps } />, {
			registry,
		} );

		expect( getByText( noticeProps.title ) ).toBeInTheDocument();
		expect( getByText( noticeProps.description ) ).toBeInTheDocument();
		expect( getByText( noticeProps.ctaLabel ) ).toBeInTheDocument();
		expect( getByText( 'No thanks' ) ).toBeInTheDocument();
	} );

	it( 'does not render when the breakdown custom dimensions already exist', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [
				'googlesitekit_event_provider',
				'googlesitekit_form_id',
			],
		} );

		const { container } = render( <BreakdownNotice { ...noticeProps } />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render before the intro modal has been dismissed', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container } = render( <BreakdownNotice { ...noticeProps } />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when the notice itself has been dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				SITE_GOALS_INTRO_MODAL_BANNER,
				SITE_GOALS_BREAKDOWN_NOTICE,
			] );

		const { container } = render( <BreakdownNotice { ...noticeProps } />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render for view-only dashboard users', () => {
		const { container } = render( <BreakdownNotice { ...noticeProps } />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'dismisses the shared notice slug and invokes onDismissComplete on dismiss', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ SITE_GOALS_BREAKDOWN_NOTICE ],
			status: 200,
		} );

		const onDismissComplete = jest.fn();

		const { getByText } = render(
			<BreakdownNotice
				{ ...noticeProps }
				onDismissComplete={ onDismissComplete }
			/>,
			{ registry }
		);

		fireEvent.click( getByText( 'No thanks' ) );

		// The tooltip callback fires only after the dismissal has persisted.
		await waitFor( () => {
			expect( onDismissComplete ).toHaveBeenCalledTimes( 1 );
		} );

		expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
			body: {
				data: { slug: SITE_GOALS_BREAKDOWN_NOTICE, expiration: 0 },
			},
		} );
	} );
} );
