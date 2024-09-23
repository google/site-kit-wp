/**
 * RRMSetupSuccessSubtleNotification component tests.
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
 * Internal dependencies
 */
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import RRMSetupSuccessSubtleNotification from './RRMSetupSuccessSubtleNotification';
import * as fixtures from '../../datastore/__fixtures__';
import * as tracking from '../../../../util/tracking';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import useQueryArg from '../../../../hooks/useQueryArg';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';

jest.mock( '../../../../hooks/useQueryArg' );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
	UNSPECIFIED,
} = PUBLICATION_ONBOARDING_STATES;

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-rrm'
)( RRMSetupSuccessSubtleNotification );

describe( 'RRMSetupSuccessSubtleNotification', () => {
	let registry;

	const invalidPublicationOnboardingStates = [ UNSPECIFIED ];

	const publicationStatesData = [
		[
			ONBOARDING_COMPLETE,
			'Customize settings',
			'Got it',
			'Your Reader Revenue Manager account was successfully set up!',
		],
		[
			PENDING_VERIFICATION,
			'Check publication status',
			'Got it',
			'Your Reader Revenue Manager account was successfully set up!',
		],
		[
			ONBOARDING_ACTION_REQUIRED,
			'Complete publication setup',
			'Got it',
			'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.',
		],
	];

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: true,
				connected: true,
			},
		] );

		useQueryArg.mockImplementation( ( arg ) => {
			const setValueMock = jest.fn();
			switch ( arg ) {
				case 'notification':
					return [ 'authentication_success', setValueMock ];
				case 'slug':
					return [ READER_REVENUE_MANAGER_MODULE_SLUG, setValueMock ];
			}
		} );

		// Provide fallback for `window.open`.
		global.open = jest.fn();
	} );

	afterEach( () => {
		global.open.mockClear();
	} );

	it.each( invalidPublicationOnboardingStates )(
		'should not render a notification and not trigger view_notification event when the publication onboarding state is %s',
		( onboardingState ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationOnboardingState( onboardingState );

			const { container } = render( <NotificationWithComponentProps />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( container ).toBeEmptyDOMElement();

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		}
	);

	it.each( publicationStatesData )(
		'should render a notification and trigger confirm_notification event when the publication onboarding state is %s',
		( onboardingState, ctaText, dismissText, message ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationOnboardingState( onboardingState );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationID( 'ABCDEFGH' );

			const { container, getByText } = render(
				<NotificationWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( container ).not.toBeEmptyDOMElement();

			const messageElement = getByText( message );
			expect( messageElement ).toBeInTheDocument();

			const ctaElement = getByText( ctaText );
			expect( ctaElement ).toBeInTheDocument();

			const dismissElement = getByText( dismissText );
			expect( dismissElement ).toBeInTheDocument();

			// expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			// 	1,
			// 	`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup-success-notification-rrm`,
			// 	'view_notification',
			// 	onboardingState
			// );

			act( () => {
				fireEvent.click( ctaElement );
			} );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup-success-notification-rrm`,
				'confirm_notification',
				onboardingState
			);
		}
	);

	it.each( publicationStatesData )(
		'should dismiss the notification and trigger dismiss_notification event when the onboarding state is %s with CTA text %s and the dismiss CTA %s is clicked',
		( onboardingState, ctaText, dismissText ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationOnboardingState( onboardingState );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationID( 'ABCDEFGH' );

			const { container, getByText } = render(
				<NotificationWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( container ).not.toBeEmptyDOMElement();

			const dismissElement = getByText( dismissText );
			expect( dismissElement ).toBeInTheDocument();

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup-success-notification-rrm`,
				'view_notification',
				onboardingState
			);

			act( () => {
				fireEvent.click( dismissElement );
			} );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_setup-success-notification-rrm`,
				'dismiss_notification',
				onboardingState
			);
		}
	);

	it( 'should sync onboarding state when the window is refocused 15 seconds after clicking the CTA', async () => {
		const originalDateNow = Date.now;

		// Mock the date to be an arbitrary time.
		const mockNow = new Date( '2020-01-01 12:30:00' ).getTime();
		Date.now = jest.fn( () => mockNow );

		jest.useFakeTimers();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: 'QRSTUVWX',
				publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
				publicationOnboardingStateLastSyncedAtMs: 0,
			} );

		fetchMock.getOnce( publicationsEndpoint, {
			body: fixtures.publications,
			status: 200,
		} );

		fetchMock.postOnce( settingsEndpoint, ( _url, opts ) => {
			const { data } = JSON.parse( opts.body );

			// Return the same settings passed to the API.
			return { body: data, status: 200 };
		} );

		const { getByText, queryByText } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		// Verify that the message relevant to the ONBOARDING_ACTION_REQUIRED
		// state is displayed.
		expect(
			getByText(
				'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.'
			)
		).toBeInTheDocument();

		// Verify that the message relevant to the ONBOARDING_COMPLETE
		// state is not displayed.
		expect(
			queryByText(
				'Your Reader Revenue Manager account was successfully set up!'
			)
		).not.toBeInTheDocument();

		act( () => {
			fireEvent.click( getByText( 'Complete publication setup' ) );
		} );

		act( () => {
			global.window.dispatchEvent( new Event( 'blur' ) );
		} );

		act( () => {
			jest.advanceTimersByTime( 15000 );
		} );

		act( () => {
			global.window.dispatchEvent( new Event( 'focus' ) );
		} );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( publicationsEndpoint );
			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: {
					data: {
						publicationID: 'QRSTUVWX',
						publicationOnboardingState: ONBOARDING_COMPLETE,
						publicationOnboardingStateLastSyncedAtMs: Date.now(),
					},
				},
			} );
		} );

		// Verify that the onboarding state has been synced.
		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationOnboardingState()
		).toBe( ONBOARDING_COMPLETE );

		// Verify that the message relevant to the ONBOARDING_COMPLETE
		// state is displayed.
		expect(
			getByText(
				'Your Reader Revenue Manager account was successfully set up!'
			)
		).toBeInTheDocument();

		// Verify that the message relevant to the ONBOARDING_ACTION_REQUIRED
		// state is not displayed.
		expect(
			queryByText(
				'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.'
			)
		).not.toBeInTheDocument();

		// Restore Date.now method.
		Date.now = originalDateNow;
	} );
} );
