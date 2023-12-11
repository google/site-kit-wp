/**
 * UACutoffWarning component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	render,
	createTestRegistry,
	fireEvent,
} from '../../../../../../tests/js/test-utils';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { getDateString, getPreviousDate, stringToDate } from '../../../../util';
import * as tracking from '../../../../util/tracking';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { UA_CUTOFF_DATE } from '../../constants';
import { GA4_AUTO_SWITCH_DATE } from '../../../analytics-4/constants';
import UACutoffWarning from './UACutoffWarning';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'UACutoffWarning', () => {
	mockLocation();

	let registry;

	let date = stringToDate( UA_CUTOFF_DATE );
	date.setDate( date.getDate() + 1 );
	const dayAfterUACutoffDate = getDateString( date );

	date = stringToDate( GA4_AUTO_SWITCH_DATE );
	date.setDate( date.getDate() + 1 );
	const dayAfterGA4AutoSwitchDate = getDateString( date );

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	const expectedMessagePreGA4AutoSwitch =
		'Your data is stale because Universal Analytics stopped collecting data on July 1, 2023.';
	const expectedMessagePostGA4AutoSwitch =
		'No fresh data to display. Universal Analytics stopped collecting data on July 1. To resume collecting Analytics data, set up Google Analytics 4.';

	it.each( [
		[
			'on the UA cutoff date',
			{
				referenceDate: UA_CUTOFF_DATE,
				expectedMessage: expectedMessagePreGA4AutoSwitch,
			},
		],
		[
			'after the UA cutoff date',
			{
				referenceDate: dayAfterUACutoffDate,
				expectedMessage: expectedMessagePreGA4AutoSwitch,
			},
		],
		[
			'on the GA4 auto-switch date',
			{
				referenceDate: GA4_AUTO_SWITCH_DATE,
				expectedMessage: expectedMessagePostGA4AutoSwitch,
			},
		],
		[
			'after the GA4 auto-switch date',
			{
				referenceDate: dayAfterGA4AutoSwitchDate,
				expectedMessage: expectedMessagePostGA4AutoSwitch,
			},
		],
	] )(
		'should render the UA cutoff warning notice when Analytics is connected while GA4 is not, and the date is %s',
		( _, { referenceDate, expectedMessage } ) => {
			provideModules( registry, [
				{
					active: true,
					connected: true,
					slug: 'analytics',
				},
				{
					active: true,
					connected: false,
					slug: 'analytics-4',
				},
			] );

			registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );

			const { container, getByText } = render( <UACutoffWarning />, {
				registry,
			} );

			expect( container ).toMatchSnapshot();

			expect( getByText( expectedMessage ) ).toBeInTheDocument();
		}
	);

	it.each( [
		[
			'Analytics is not connected',
			{
				analyticsConnected: false,
				analytics4Connected: false,
				referenceDate: UA_CUTOFF_DATE,
			},
		],
		[
			'Analytics 4 is connected',
			{
				analyticsConnected: true,
				analytics4Connected: true,
				referenceDate: UA_CUTOFF_DATE,
			},
		],
		[
			'the date is before the UA cutoff date',
			{
				analyticsConnected: true,
				analytics4Connected: false,
				referenceDate: getPreviousDate( UA_CUTOFF_DATE, 1 ),
			},
		],
	] )(
		'should not render the UA cutoff warning notice when %s',
		( _, { analyticsConnected, analytics4Connected, referenceDate } ) => {
			provideModules( registry, [
				{
					active: true,
					connected: analyticsConnected,
					slug: 'analytics',
				},
				{
					active: true,
					connected: analytics4Connected,
					slug: 'analytics-4',
				},
			] );

			registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );

			const { container } = render( <UACutoffWarning />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it( 'should track an event as soon as the warning appears', () => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
			{
				active: true,
				connected: false,
				slug: 'analytics-4',
			},
		] );

		registry.dispatch( CORE_USER ).setReferenceDate( UA_CUTOFF_DATE );

		render( <UACutoffWarning />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_widget-ua-stale-warning',
			'view_notification'
		);
	} );

	it( 'should track an event and navigate to the settings page when the CTA is clicked', async () => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
			{
				active: true,
				connected: false,
				slug: 'analytics-4',
			},
		] );

		registry.dispatch( CORE_USER ).setReferenceDate( UA_CUTOFF_DATE );

		const { getByRole, waitForRegistry } = render( <UACutoffWarning />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click( getByRole( 'button' ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_widget-ua-stale-warning',
			'confirm_notification'
		);

		await waitForRegistry();

		expect( registry.select( CORE_LOCATION ).getNavigateURL() ).toBe(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#connected-services/analytics/edit'
		);
	} );

	it( 'should track an event when the learn more link is clicked', () => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
			{
				active: true,
				connected: false,
				slug: 'analytics-4',
			},
		] );

		registry.dispatch( CORE_USER ).setReferenceDate( UA_CUTOFF_DATE );

		const { getByRole } = render( <UACutoffWarning />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click( getByRole( 'link' ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_widget-ua-stale-warning',
			'click_learn_more_link'
		);
	} );
} );
