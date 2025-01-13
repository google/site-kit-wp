/**
 * `core/notifications` data store: notifications tests.
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
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import { render } from '../../../../../tests/js/test-utils';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from './constants';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '../../constants';
import { CORE_USER } from '../../datastore/user/constants';

describe( 'core/notifications Notifications', () => {
	const fetchGetDismissedItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	let registry;
	let store;
	let registerNotification;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_NOTIFICATIONS ].store;
		( { registerNotification } = registry.dispatch( CORE_NOTIFICATIONS ) );
	} );

	describe( 'actions', () => {
		describe( 'registerNotification', () => {
			const id = 'test-notification-id';
			function TestNotificationComponent( props ) {
				return <div>Hello { props.children }!</div>;
			}

			it( 'should require a Component to be provided', () => {
				expect( () => registerNotification( id, {} ) ).toThrow(
					'Component is required to register a notification.'
				);
			} );

			it( 'should require a valid areaSlug to be provided', () => {
				expect( () =>
					registerNotification( id, {
						Component: TestNotificationComponent,
						areaSlug: 'some-random-area',
					} )
				).toThrow( 'Notification area should be one of:' );
			} );

			it( 'should require a valid array of view contexts to be provided', () => {
				expect( () =>
					registerNotification( id, {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ 'some-random-view-context' ],
					} )
				).toThrow( 'Notification view context should be one of:' );
			} );

			it( 'should register the notification with the given settings and component', () => {
				registerNotification( id, {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 11,
					checkRequirements: () => true,
					isDismissible: false,
				} );

				const { notifications } = store.getState();

				expect( notifications[ id ].Component ).toEqual(
					TestNotificationComponent
				);
				expect( notifications[ id ].areaSlug ).toBe(
					NOTIFICATION_AREAS.BANNERS_ABOVE_NAV
				);
				expect( notifications[ id ].viewContexts ).toEqual( [
					VIEW_CONTEXT_MAIN_DASHBOARD,
				] );
				expect( notifications[ id ].priority ).toBe( 11 );
				expect( typeof notifications[ id ].checkRequirements ).toBe(
					'function'
				);

				// Ensure we can render a component with the notification's component, verifying it's still a
				// usable React component.
				const { Component } = store.getState().notifications[ id ];
				const { container } = render( <Component>world</Component> );
				expect( container.firstChild ).toMatchSnapshot();
			} );

			it( 'should not overwrite an existing notification', () => {
				function NotificationOne() {
					return <div>Hello world!</div>;
				}
				function NotificationOneRedone() {
					return <div>Goodbye you!</div>;
				}
				registerNotification( id, {
					Component: NotificationOne,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );

				registerNotification( id, {
					Component: NotificationOneRedone,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );
				expect( console ).toHaveWarnedWith(
					`Could not register notification with ID "${ id }". Notification "${ id }" is already registered.`
				);

				// Ensure original notification's component is registered.
				expect( store.getState().notifications[ id ].Component ).toBe(
					NotificationOne
				);
			} );
		} );

		describe( 'dismissNotification', () => {
			function TestNotificationComponent() {
				return <div>Test notification!</div>;
			}
			let dismissNotification;
			beforeEach( () => {
				( { dismissNotification } =
					registry.dispatch( CORE_NOTIFICATIONS ) );
				// dismissNotification checks for a registered notification's isDismissible property.
				registerNotification( 'test-notification', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );
			} );

			it( 'should require a valid id to be provided', () => {
				expect( () => dismissNotification() ).toThrow(
					'A notification id is required to dismiss a notification.'
				);
			} );

			it( 'should dismiss a notification without a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'test-notification' ],
				} );

				await dismissNotification( 'test-notification' );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'test-notification',
							expiration: 0,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'test-notification' );

				expect( isNotificationDismissed ).toBe( true );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should dismiss a notification with a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'test-notification' ],
				} );

				await dismissNotification( 'test-notification', {
					expiresInSeconds: 3,
				} );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'test-notification',
							expiration: 3,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'test-notification' );
				expect( isNotificationDismissed ).toBe( true );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not persist dismissal if notification is not dismissible', async () => {
				// dismissNotification checks for a registered notification's isDismissible property.
				registerNotification( 'not-dismissible-notification', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: false,
				} );

				await dismissNotification( 'not-dismissible-notification', {
					expiresInSeconds: 3,
				} );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should persist dismissal if notification is dismissible', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'dismissible-notification' ],
				} );
				// dismissNotification checks for a registered notification's isDismissible property.
				registerNotification( 'dismissible-notification', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.receiveQueuedNotifications( [
						{ id: 'dismissible-notification' },
					] );

				await dismissNotification( 'dismissible-notification', {
					expiresInSeconds: 3,
				} );

				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'dismissible-notification',
							expiration: 3,
						},
					},
				} );
			} );

			it( 'should remove a notification from queue if skipHidingFromQueue option is not passed', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'test-notification' ],
				} );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				let queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toContain(
					'test-notification'
				);

				await dismissNotification( 'test-notification' );

				queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect(
					queuedNotifications.map( ( { id } ) => id )
				).not.toContain( 'test-notification' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not remove a notification from queue if skipHidingFromQueue option is passed', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'test-notification' ],
				} );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				let queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toContain(
					'test-notification'
				);

				await dismissNotification( 'test-notification', {
					skipHidingFromQueue: true,
				} );

				queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toContain(
					'test-notification'
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		function TestNotificationComponent() {
			return <div>Test notification!</div>;
		}

		describe( 'getQueuedNotifications', () => {
			beforeEach( () => {
				// `getQueuedNotifications` requires `getDismissedItems()` to be resolved
				// before filtering notifications to be queued.
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'some-test-dismissed-item' ] );
			} );

			it( 'requires viewContext', () => {
				expect( () => {
					registry
						.select( CORE_NOTIFICATIONS )
						.getQueuedNotifications();
				} ).toThrow( 'viewContext is required.' );
			} );

			it( 'should return undefined when no notifications have been registered', () => {
				const queuedNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications ).toBeUndefined();
			} );

			it( 'should return registered notifications for a given viewContext', async () => {
				registerNotification( 'test-notification-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );
				registerNotification( 'test-notification-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_ENTITY_DASHBOARD ],
				} );
				registerNotification( 'test-notification-3', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [
						VIEW_CONTEXT_ENTITY_DASHBOARD,
						VIEW_CONTEXT_MAIN_DASHBOARD,
					],
				} );

				const queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual(
					expect.arrayContaining( [
						'test-notification-1',
						'test-notification-3',
					] )
				);
			} );

			it( 'should return registered and grouped notifications by their groupID', async () => {
				registerNotification( 'default-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
				} );
				registerNotification( 'setup-cta-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
					priority: 20,
				} );
				registerNotification( 'default-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
				} );
				registerNotification( 'setup-cta-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
					priority: 20,
				} );

				const queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.SETUP_CTAS
					);

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual(
					expect.arrayContaining( [ 'setup-cta-1', 'setup-cta-2' ] )
				);
			} );

			it( 'should return notifications filtered by their checkRequirements callback when specified', async () => {
				// Setup a test store with a selector so we can verify the `getQueuedNotifications` selector
				// passes the `registry` through to the notification's `checkRequirements` callback.
				const TEST_STORE = 'test-store';
				registry.registerStore( TEST_STORE, {
					reducer: ( state ) => state,
					selectors: {
						testActiveNotification: () => true,
						testInactiveNotification: () => false,
						testErroredInactiveNotification: () => {
							throw new Error(
								'Check requirements threw an error.'
							);
						},
					},
				} );

				registerNotification( 'check-requirements-true', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testActiveNotification(),
				} );

				registerNotification( 'check-requirements-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testInactiveNotification(),
				} );

				registerNotification( 'check-requirements-errored-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testErroredInactiveNotification(),
				} );

				registerNotification( 'check-requirements-undefined', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );

				const queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual(
					expect.arrayContaining( [
						'check-requirements-true',
						'check-requirements-undefined',
					] )
				);
			} );

			it( 'should return registered notifications filtered by their dismissal status when specified', async () => {
				registerNotification( 'is-dismissible-true-and-dismissed', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				registerNotification( 'is-dismissible-true-but-not-dismissed', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				registerNotification( 'is-dismissible-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: false,
				} );

				registerNotification( 'is-dismissible-undefined', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );

				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						'is-dismissible-true-and-dismissed',
					] );

				const queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual(
					expect.arrayContaining( [
						'is-dismissible-false',
						'is-dismissible-true-but-not-dismissed',
						'is-dismissible-undefined',
					] )
				);
			} );

			it( 'should return registered notifications ordered by priority', async () => {
				registerNotification( 'medium-2-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 25,
				} );
				registerNotification( 'lowest-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 30,
				} );
				registerNotification( 'medium-1-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 20,
				} );
				registerNotification( 'highest-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );

				const queuedNotifications = await registry
					.resolveSelect( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual( [
					'highest-priority',
					'medium-1-priority',
					'medium-2-priority',
					'lowest-priority',
				] );
			} );
		} );

		describe( 'isNotificationDismissed', () => {
			let isNotificationDismissed;
			beforeEach( () => {
				( { isNotificationDismissed } =
					registry.select( CORE_NOTIFICATIONS ) );
			} );

			it( 'should return undefined if getDismissedItems selector is not resolved yet', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
				expect( isNotificationDismissed( 'foo' ) ).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getDismissedItems();
			} );

			it( 'should return TRUE if the notification is dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect( isNotificationDismissed( 'foo' ) ).toBe( true );
			} );

			it( 'should return FALSE if the notification is not dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect( isNotificationDismissed( 'baz' ) ).toBe( false );
			} );
		} );
	} );
} );
