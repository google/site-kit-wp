/**
 * SetupCTAOverlays component tests.
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
 * Internal dependencies
 */
import SetupCTAOverlays from '@/js/components/notifications/SetupCTAOverlays';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';

const OVERLAY_NOTIFICATION_ID = 'test-overlay-notification';
const OVERLAY_TEXT = 'Test overlay content';

const TestOverlay: FC = () => <div>{ OVERLAY_TEXT }</div>;

describe( 'SetupCTAOverlays', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	} );

	function registerOverlayFor( viewContexts: string[] ) {
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( OVERLAY_NOTIFICATION_ID, {
				Component: TestOverlay,
				areaSlug: NOTIFICATION_AREAS.OVERLAYS,
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContexts,
				isDismissible: false,
			} );
	}

	it.each( [
		[ 'the main dashboard', VIEW_CONTEXT_MAIN_DASHBOARD ],
		[ 'the entity dashboard', VIEW_CONTEXT_ENTITY_DASHBOARD ],
		[
			'the view-only entity dashboard',
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		],
	] )( 'renders a queued overlay on %s', async ( _label, viewContext ) => {
		registerOverlayFor( [ viewContext ] );

		const { findByText, waitForRegistry } = render( <SetupCTAOverlays />, {
			registry,
			viewContext,
		} );

		await waitForRegistry();

		expect( await findByText( OVERLAY_TEXT ) ).toBeInTheDocument();
	} );

	it( 'renders nothing while a tour is running', () => {
		registerOverlayFor( [ VIEW_CONTEXT_MAIN_DASHBOARD ] );
		registry.dispatch( CORE_USER ).receiveCurrentTour( {
			slug: 'someTour',
			steps: [],
			gaEventCategory: 'test',
		} );

		// No `waitForRegistry()` here: the component bails out before it reads
		// the queue, so nothing in the registry ever changes.
		const { queryByText } = render( <SetupCTAOverlays />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( queryByText( OVERLAY_TEXT ) ).not.toBeInTheDocument();
	} );
} );
