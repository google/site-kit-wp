/**
 * SettingsCardVisitorGroups SetupSuccess component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
	waitFor,
	waitForDefaultTimeouts,
} from '../../../../../../../../../tests/js/test-utils';
import { mockLocation } from '../../../../../../../../../tests/js/mock-browser-utils';
import { AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION } from '../../../../../../../googlesitekit/widgets/default-areas';
import { CORE_SITE } from '../../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_SETTINGS } from '../../../../../../../googlesitekit/constants';
import * as tracking from '../../../../../../../util/tracking';
import SetupSuccess, {
	SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION,
} from '.';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: vi.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SettingsCardVisitorGroups SetupSuccess', () => {
	let registry;
	let dismissItemSpy;

	mockLocation();

	beforeEach( () => {
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();

		provideSiteInfo( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		dismissItemSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissItem'
		);

		dismissItemSpy.mockImplementation( () => Promise.resolve() );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			isAudienceSegmentationWidgetHidden: false,
			configuredAudiences: null,
		} );
	} );

	afterEach( () => {
		dismissItemSpy.mockReset();
		mockTrackEvent.mockClear();
	} );

	it( 'should render the setup success notification', () => {
		const { getByText, getByRole } = render( <SetupSuccess />, {
			registry,
		} );

		expect(
			getByText(
				'We’ve added the visitor groups section to your dashboard!'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Got it/i } )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Show me/i } )
		).toBeInTheDocument();
	} );

	it( 'should track an event when the notification is viewed', () => {
		const { rerender } = render( <SetupSuccess />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		// Simulate the CTA becoming visible.
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: true,
			intersectionRatio: 1,
		} ) );

		rerender( <SetupSuccess /> );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_audiences-setup-cta-settings-success',
			'view_notification'
		);
	} );

	it( 'should dismiss the notification if "Got it" is clicked on', async () => {
		expect(
			registry
				.select( CORE_UI )
				.getValue( SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION )
		).toBeUndefined();

		const { queryByText, getByRole } = render( <SetupSuccess />, {
			registry,
		} );

		expect(
			queryByText(
				'We’ve added the visitor groups section to your dashboard!'
			)
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect(
			registry
				.select( CORE_UI )
				.getValue( SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION )
		).toBe( false );
	} );

	it( 'should track an event when "Got it" is clicked on', async () => {
		const { getByRole } = render( <SetupSuccess />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_audiences-setup-cta-settings-success',
			'dismiss_notification'
		);
	} );

	it( 'should dismiss the notification and navigate to dashboard if "Show me" is clicked on', async () => {
		expect(
			registry
				.select( CORE_UI )
				.getValue( SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION )
		).toBeUndefined();

		const { queryByText, getByRole } = render( <SetupSuccess />, {
			registry,
		} );

		expect(
			queryByText(
				'We’ve added the visitor groups section to your dashboard!'
			)
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Show me/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect(
			registry
				.select( CORE_UI )
				.getValue( SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION )
		).toBe( false );

		const expectedURL = addQueryArgs(
			registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-dashboard' ),
			{
				widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
			}
		);

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalledWith(
				expectedURL
			);
		} );
	} );

	it( 'should track an event when "Show me" is clicked on', async () => {
		const { getByRole } = render( <SetupSuccess />, {
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: /Show me/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_audiences-setup-cta-settings-success',
			'confirm_notification'
		);
	} );
} );
