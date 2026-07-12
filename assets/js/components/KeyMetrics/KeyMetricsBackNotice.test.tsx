/**
 * KeyMetricsBackNotice component tests.
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
import { intersectionObserver } from '@shopify/jest-dom-mocks';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import * as tracking from '@/js/util/tracking';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	KEY_METRICS_BACK_NOTICE_SLUG,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import KeyMetricsBackNotice from './KeyMetricsBackNotice';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'KeyMetricsBackNotice', () => {
	let registry: WPDataRegistry;

	const viewContext = VIEW_CONTEXT_MAIN_DASHBOARD;

	const { Widget } = getWidgetComponentProps( 'keyMetricsBackNotice' );

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		intersectionObserver.mock();

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		intersectionObserver.restore();
		mockTrackEvent.mockClear();
	} );

	it( 'should render the notice with the expected copy and buttons', () => {
		const { getByText, getByRole } = render(
			<KeyMetricsBackNotice Widget={ Widget } />,
			{ registry }
		);

		expect(
			getByText( 'Key metrics are back on your dashboard' )
		).toBeInTheDocument();
		expect(
			getByText( /This section is now an integral part of the dashboard/ )
		).toBeInTheDocument();
		expect( getByRole( 'button', { name: 'Got it' } ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Select metrics' } )
		).toBeInTheDocument();
	} );

	it( 'should dismiss the notice when the "Got it" button is clicked', async () => {
		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ KEY_METRICS_BACK_NOTICE_SLUG ] ),
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<KeyMetricsBackNotice Widget={ Widget } />,
			{ registry, viewContext }
		);

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		await waitForRegistry();

		expect(
			registry
				.select( CORE_USER )
				.isItemDismissed( KEY_METRICS_BACK_NOTICE_SLUG )
		).toBe( true );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ viewContext }_kmw-reshown`,
			'dismiss_notice'
		);
	} );

	it( 'should dismiss the notice and open the selection panel when "Select metrics" is clicked', async () => {
		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ KEY_METRICS_BACK_NOTICE_SLUG ] ),
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<KeyMetricsBackNotice Widget={ Widget } />,
			{ registry, viewContext }
		);

		fireEvent.click( getByRole( 'button', { name: 'Select metrics' } ) );

		await waitForRegistry();

		expect(
			registry
				.select( CORE_UI )
				.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
		expect(
			registry
				.select( CORE_USER )
				.isItemDismissed( KEY_METRICS_BACK_NOTICE_SLUG )
		).toBe( true );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ viewContext }_kmw-reshown`,
			'confirm_notice'
		);
		expect( mockTrackEvent ).not.toHaveBeenCalledWith(
			`${ viewContext }_kmw-reshown`,
			'dismiss_notice'
		);
	} );

	it( 'should track the view_notice event when the notice is viewed', async () => {
		render( <KeyMetricsBackNotice Widget={ Widget } />, {
			registry,
			viewContext,
		} );

		expect( mockTrackEvent ).not.toHaveBeenCalled();

		// Simulate the notice coming into view.
		act( () => {
			intersectionObserver.simulate( {
				isIntersecting: true,
				intersectionRatio: 1,
			} );
		} );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ viewContext }_kmw-reshown`,
				'view_notice'
			);
		} );
	} );
} );
