/**
 * OptIn component tests.
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
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideTracking,
	fireEvent,
	muteFetch,
	act,
} from '../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import OptIn from './OptIn';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'OptIn', () => {
	let registry;

	const coreUserTrackingSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/tracking'
	);

	const optInProps = {
		id: 'googlesitekit-opt-in-test',
		name: 'optInTest',
		className: 'googlesitekit-opt-in-test',
		alignLeftCheckbox: true,
	};

	beforeEach( () => {
		registry = createTestRegistry();
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should render correctly', () => {
		provideTracking( registry, false );

		const { container, getByRole, getByText } = render(
			<OptIn { ...optInProps } />,
			{
				viewContext: 'test-view-context',
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect( getByRole( 'checkbox' ) ).toBeInTheDocument();

		expect(
			getByText(
				'Help us improve Site Kit by sharing anonymous usage data.'
			)
		).toBeInTheDocument();
	} );

	it( 'should show a spinner when tracking is loading', () => {
		muteFetch( coreUserTrackingSettingsEndpointRegExp );

		const { container, queryByRole } = render( <OptIn />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( queryByRole( 'checkbox' ) ).not.toBeInTheDocument();

		expect( container.querySelector( '.spinner' ) ).toBeInTheDocument();
	} );

	it( 'should enable tracking when the user opts in', async () => {
		provideTracking( registry, false );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: true },
		} );

		const { getByRole } = render( <OptIn { ...optInProps } />, {
			registry,
		} );

		expect( getByRole( 'checkbox' ) ).not.toBeChecked();
		expect( tracking.isTrackingEnabled() ).toBe( false );

		fireEvent.click( getByRole( 'checkbox' ) );

		expect( getByRole( 'checkbox' ) ).toBeChecked();

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.isTrackingEnabled() ).toBe( true );
	} );

	it( 'should disable tracking when the user opts out', async () => {
		provideTracking( registry, true );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: false },
		} );

		const { getByRole } = render( <OptIn { ...optInProps } />, {
			registry,
		} );

		expect( getByRole( 'checkbox' ) ).toBeChecked();
		expect( tracking.isTrackingEnabled() ).toBe( true );

		fireEvent.click( getByRole( 'checkbox' ) );

		expect( getByRole( 'checkbox' ) ).not.toBeChecked();

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.isTrackingEnabled() ).toBe( false );
	} );

	it( 'should show an error message when the tracking setting update fails', async () => {
		provideTracking( registry, false );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 500,
			body: {
				message: 'Internal server error',
			},
		} );

		const { getByRole, getByText } = render( <OptIn { ...optInProps } />, {
			registry,
		} );

		expect( getByRole( 'checkbox' ) ).not.toBeChecked();
		expect( tracking.isTrackingEnabled() ).toBe( false );

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( getByRole( 'checkbox' ) ).not.toBeChecked();
		expect( tracking.isTrackingEnabled() ).toBe( false );

		expect( getByText( 'Internal server error' ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'should track an event when the user opts in', async () => {
		provideTracking( registry, false );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: true },
		} );

		const { getByRole } = render( <OptIn { ...optInProps } />, {
			registry,
			viewContext: 'test-view-context',
		} );

		expect( tracking.trackEvent ).not.toHaveBeenCalled();

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.trackEvent ).toHaveBeenCalledWith(
			'test-view-context',
			'tracking_optin'
		);
		expect( tracking.trackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track an event with a custom category', async () => {
		provideTracking( registry, false );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: true },
		} );

		const { getByRole } = render(
			<OptIn
				{ ...optInProps }
				trackEventCategory="test-event-category"
			/>,
			{
				registry,
				viewContext: 'test-view-context',
			}
		);

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.trackEvent ).toHaveBeenCalledWith(
			'test-event-category',
			'tracking_optin'
		);
	} );

	it( 'should track an event with a custom action', async () => {
		provideTracking( registry, false );
		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: true },
		} );

		const { getByRole } = render(
			<OptIn { ...optInProps } trackEventAction="test-event-action" />,
			{
				registry,
				viewContext: 'test-view-context',
			}
		);

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.trackEvent ).toHaveBeenCalledWith(
			'test-view-context',
			'test-event-action'
		);
		expect( tracking.trackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not track an event when the user opts out', async () => {
		provideTracking( registry, true );

		fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
			status: 200,
			body: { enabled: false },
		} );

		const { getByRole } = render( <OptIn { ...optInProps } />, {
			registry,
		} );

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( tracking.trackEvent ).not.toHaveBeenCalled();
	} );
} );
