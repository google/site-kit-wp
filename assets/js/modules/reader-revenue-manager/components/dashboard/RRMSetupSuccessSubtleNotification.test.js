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
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_GROUPS,
} from '../../../../googlesitekit/notifications/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
} from '../../datastore/constants';
import * as tracking from '../../../../util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import useQueryArg from '../../../../hooks/useQueryArg';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';

jest.mock( '../../../../hooks/useQueryArg' );
const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
	UNSPECIFIED,
} = PUBLICATION_ONBOARDING_STATES;

const id = 'setup-success-notification-rrm';

const NotificationWithComponentProps = withNotificationComponentProps( id )(
	RRMSetupSuccessSubtleNotification
);

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

	const syncOnboardingStateEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/sync-publication-onboarding-state'
	);

	const setValueMock = jest.fn();

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: true,
				connected: true,
			},
		] );

		useQueryArg.mockImplementation( ( arg ) => {
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
		setValueMock.mockClear();
		useQueryArg.mockClear();
		global.open.mockClear();
	} );

	it.each( invalidPublicationOnboardingStates )(
		'should not render a notification when the publication onboarding state is %s',
		( onboardingState ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationOnboardingState( onboardingState );

			const { container } = render( <NotificationWithComponentProps />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it.each( publicationStatesData )(
		'should render a notification when the publication onboarding state is %s',
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
		}
	);

	it.each( publicationStatesData )(
		'should dismiss the notification when the onboarding state is %s with CTA text %s and the dismiss CTA %s is clicked',
		async ( onboardingState, ctaText, dismissText ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationOnboardingState( onboardingState );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationID( 'ABCDEFGH' );

			await registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification( id, {
					Component: NotificationWithComponentProps,
					areaSlug: 'notification-area-banners-above-nav',
					viewContexts: [ 'mainDashboard' ],
					isDismissible: false,
				} );

			await registry
				.dispatch( CORE_NOTIFICATIONS )
				.receiveQueuedNotifications(
					[ { id } ],
					NOTIFICATION_GROUPS.DEFAULT
				);

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

			act( () => {
				fireEvent.click( dismissElement );
			} );

			expect( setValueMock ).toHaveBeenCalledTimes( 2 );
			expect( setValueMock ).toHaveBeenCalledWith( undefined );
		}
	);

	it( 'should sync onboarding state when the window is refocused 15 seconds after clicking the CTA', async () => {
		jest.useFakeTimers();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: 'QRSTUVWX',
				publicationOnboardingState: ONBOARDING_ACTION_REQUIRED,
				publicationOnboardingStateChanged: false,
			} );

		fetchMock.getOnce( publicationsEndpoint, {
			body: fixtures.publications,
			status: 200,
		} );

		fetchMock.postOnce( syncOnboardingStateEndpoint, () => {
			return {
				body: {
					publicationID: 'QRSTUVWX',
					publicationOnboardingState: ONBOARDING_COMPLETE,
				},
				status: 200,
			};
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
			expect(
				registry
					.select( CORE_UI )
					.getValue(
						UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
					)
			).toBeUndefined();

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
			expect( fetchMock ).toHaveFetched( syncOnboardingStateEndpoint );
		} );

		// Verify that the onboarding state has been synced.
		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationOnboardingState()
		).toBe( ONBOARDING_COMPLETE );

		// Ensure that the UI key is set to true.
		expect(
			registry
				.select( CORE_UI )
				.getValue(
					UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
				)
		).toBe( true );

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
	} );

	const notificationContent = [
		[
			'subscription model with product ID set',
			{
				paymentOption: 'subscriptions',
				productID: 'product-1',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'You can edit your settings and select which of your site’s pages will include a subscription CTA.',
				ctaText: 'Manage CTAs',
			},
		],
		[
			'subscription model with product ID not set',
			{
				paymentOption: 'subscriptions',
				productID: 'openaccess',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'You can edit your settings to manage product IDs and select which of your site’s pages will include a subscription CTA.',
				ctaText: 'Manage CTAs',
			},
		],
		[
			'contribution model with no available product IDs',
			{
				paymentOption: 'contributions',
				productIDs: [],
				productID: 'openaccess',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'You can edit your settings and select which of your site’s pages will include a contribution CTA.',
				ctaText: 'Manage CTAs',
			},
		],
		[
			'contribution model with available product IDs but no product ID set',
			{
				paymentOption: 'contributions',
				productIDs: [ 'product-1', 'product-2' ],
				productID: 'openaccess',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'You can edit your settings to manage product IDs and select which of your site’s pages will include a contribution CTA.',
				ctaText: 'Manage CTAs',
			},
		],
		[
			'contribution model with available product IDs and a product ID set',
			{
				paymentOption: 'contributions',
				productIDs: [ 'product-1', 'product-2' ],
				productID: 'product-1',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'You can edit your settings and select which of your site’s pages will include a contribution CTA.',
				ctaText: 'Manage CTAs',
			},
		],
		[
			'non-monetization model',
			{
				paymentOption: 'noPayment',
				productIDs: [],
				productID: 'openaccess',
			},
			{
				title: 'Success! Your Reader Revenue Manager account is set up',
				description:
					'Explore Reader Revenue Manager’s additional features, such as paywalls, subscriptions and contributions.',
				ctaText: 'Get started',
			},
		],
	];

	it.each( notificationContent )(
		'should render appropriate content for %s',
		( _model, settings, { title, description, ctaText } ) => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					...settings,
					publicationOnboardingState: ONBOARDING_COMPLETE,
				} );

			const { getByText } = render( <NotificationWithComponentProps />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( getByText( title ) ).toBeInTheDocument();
			expect( getByText( description ) ).toBeInTheDocument();
			expect( getByText( ctaText ) ).toBeInTheDocument();
		}
	);

	it( 'should display overlay notification on successful module setup with a publication that has no CTAs', async () => {
		expect(
			registry
				.select( CORE_UI )
				.getValue(
					UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
				)
		).toBeUndefined();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationOnboardingState: ONBOARDING_COMPLETE,
				paymentOption: '',
				productIDs: [],
				productID: 'openaccess',
			} );

		const { waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			registry
				.select( CORE_UI )
				.getValue(
					UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
				)
		).toBe( true );
	} );

	describe( 'GA event tracking', () => {
		beforeEach( async () => {
			mockTrackEvent.mockClear();

			await registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification( id, {
					Component: NotificationWithComponentProps,
					areaSlug: 'notification-area-banners-above-nav',
					viewContexts: [ 'mainDashboard' ],
					isDismissible: false,
				} );

			registry
				.dispatch( CORE_UI )
				.setValue( `notification/${ id }/viewed`, true );
		} );

		it( 'should track the events when the notification is dismissed', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState: ONBOARDING_COMPLETE,
					paymentOption: 'subscriptions',
					productID: 'basic',
				} );

			const { getByRole, waitForRegistry } = render(
				<NotificationWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				'mainDashboard_setup-success-notification-rrm',
				'view_notification',
				'ONBOARDING_COMPLETE:subscriptions:yes',
				undefined
			);

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				'mainDashboard_setup-success-notification-rrm',
				'dismiss_notification',
				'ONBOARDING_COMPLETE:subscriptions:yes',
				undefined
			);
		} );

		it( 'should track the event when the "Learn more" link is clicked', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState: ONBOARDING_COMPLETE,
					paymentOption: 'noPayment',
					productID: 'advanced',
				} );

			const { getByText, waitForRegistry } = render(
				<NotificationWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				'mainDashboard_setup-success-notification-rrm',
				'view_notification',
				'ONBOARDING_COMPLETE:noPayment:yes',
				undefined
			);

			// "Learn more" link should be present.
			const learnMoreLink = getByText( 'Learn more' );
			expect( learnMoreLink ).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( learnMoreLink );
			} );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				'mainDashboard_setup-success-notification-rrm',
				'click_learn_more_link',
				'ONBOARDING_COMPLETE:noPayment:yes',
				undefined
			);
		} );

		it( 'should track the event when the CTA button is clicked', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState: ONBOARDING_COMPLETE,
					paymentOption: 'noPayment',
					productID: 'basic',
				} );

			const { getByText, waitForRegistry } = render(
				<NotificationWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				'mainDashboard_setup-success-notification-rrm',
				'view_notification',
				'ONBOARDING_COMPLETE:noPayment:yes',
				undefined
			);

			// CTA button should be present.
			const ctaButton = getByText( 'Get started' );
			expect( ctaButton ).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( ctaButton );
			} );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				'mainDashboard_setup-success-notification-rrm',
				'confirm_notification',
				'ONBOARDING_COMPLETE:noPayment:yes',
				undefined
			);
		} );
	} );
} );
