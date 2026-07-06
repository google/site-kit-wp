/**
 * OverlayNotification layout component tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { createTestRegistry, render } from '@tests/js/test-utils';
import OverlayNotification from './OverlayNotification';

jest.mock( '@/js/hooks/useBreakpoint', () => ( {
	...jest.requireActual( '@/js/hooks/useBreakpoint' ),
	useBreakpoint: jest.fn(),
} ) );

describe( 'OverlayNotification', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	let anchor: HTMLButtonElement;

	beforeEach( () => {
		registry = createTestRegistry();
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );

		anchor = document.createElement( 'button' );
		anchor.className = 'test-anchor';
		document.body.appendChild( anchor );
	} );

	afterEach( () => {
		anchor.remove();
	} );

	function renderOverlayNotification( props = {} ) {
		return render(
			<OverlayNotification
				notificationID="test-notification"
				title="Test title"
				{ ...props }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
	}

	it( 'renders in the default overlay slot without an anchorID', () => {
		const { container, getByText } = renderOverlayNotification();

		expect( getByText( 'Test title' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper-root' )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-overlay-card--anchored' )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper__arrow' )
		).not.toBeInTheDocument();
	} );

	it( 'renders anchored through the Popper when the anchorID resolves to an element', () => {
		const { container, getByText } = renderOverlayNotification( {
			anchorID: '.test-anchor',
		} );

		expect( getByText( 'Test title' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper-root' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-overlay-card--anchored' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper__arrow' )
		).toBeInTheDocument();
	} );

	it( 'falls back to the default overlay slot when the anchorID does not resolve to an element', () => {
		const { container, getByText } = renderOverlayNotification( {
			anchorID: '.does-not-exist',
		} );

		expect( getByText( 'Test title' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper-root' )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-overlay-card--anchored' )
		).not.toBeInTheDocument();
	} );

	it( 'falls back to the default layout on the small breakpoint even when the anchorID resolves', () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_SMALL );

		const { container, getByText } = renderOverlayNotification( {
			anchorID: '.test-anchor',
		} );

		expect( getByText( 'Test title' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-popper-root' )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-overlay-card--anchored' )
		).not.toBeInTheDocument();
	} );
} );
