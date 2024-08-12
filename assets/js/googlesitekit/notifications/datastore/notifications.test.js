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
import { CORE_NOTIFICATIONS, NOTIFICATION_AREAS } from './constants';
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

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_NOTIFICATIONS ].store;
	} );

	describe( 'actions', () => {
		describe( 'registerNotification', () => {
			const id = 'test-notification-id';
			function TestNotificationComponent( props ) {
				return <div>Hello { props.children }!</div>;
			}

			it( 'should require a Component to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {} )
				).toThrow(
					'Component is required to register a notification.'
				);
			} );

			it( 'should require a valid areaSlug to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {
							Component: TestNotificationComponent,
							areaSlug: 'some-random-area',
						} )
				).toThrow( 'Notification area should be one of:' );
			} );

			it( 'should require a valid array of view contexts to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.registerNotification( id, {
							Component: TestNotificationComponent,
							areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
							viewContexts: [ 'some-random-view-context' ],
						} )
				).toThrow( 'Notification view context should be one of:' );
			} );

			it( 'should register the notification with the given settings and component', () => {
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
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
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
						Component: NotificationOne,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( id, {
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
			it( 'should require a valid id to be provided', () => {
				expect( () =>
					registry
						.dispatch( CORE_NOTIFICATIONS )
						.dismissNotification()
				).toThrow(
					'A notification id is required to dismiss a notification.'
				);
			} );
			it( 'should dismiss a notification without a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'foo' ],
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.dismissNotification( 'foo' );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'foo',
							expiration: 0,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'foo' );
				expect( isNotificationDismissed ).toBe( true );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
			it( 'should dismiss a notification with a given expiry time', async () => {
				fetchMock.postOnce( fetchDismissItem, {
					body: [ 'foo' ],
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.dismissNotification( 'foo', { expiresInSeconds: 3 } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'foo',
							expiration: 3,
						},
					},
				} );

				const isNotificationDismissed = registry
					.select( CORE_NOTIFICATIONS )
					.isNotificationDismissed( 'foo' );
				expect( isNotificationDismissed ).toBe( true );

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
					.getQueuedNotifications( [ VIEW_CONTEXT_MAIN_DASHBOARD ] );

				expect( queuedNotifications ).toBeUndefined();
			} );

			it( 'should return registered notifications for a given viewContext', async () => {
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'test-notification-1', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'test-notification-2', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_ENTITY_DASHBOARD ],
					} );
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'test-notification-3', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [
							VIEW_CONTEXT_ENTITY_DASHBOARD,
							VIEW_CONTEXT_MAIN_DASHBOARD,
						],
					} );

				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD )
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				const queuedNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications ).toHaveLength( 2 );
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

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'check-requirements-true', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						checkRequirements: ( { select } ) =>
							select( TEST_STORE ).testActiveNotification(),
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'check-requirements-false', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						checkRequirements: ( { select } ) =>
							select( TEST_STORE ).testInactiveNotification(),
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'check-requirements-errored-false', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						checkRequirements: ( { select } ) =>
							select(
								TEST_STORE
							).testErroredInactiveNotification(),
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'check-requirements-undefined', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );

				registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				const queuedNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );
				expect( queuedNotifications ).toHaveLength( 2 );
				expect( queuedNotifications[ 0 ].id ).toBe(
					'check-requirements-true'
				);
				expect( queuedNotifications[ 1 ].id ).toBe(
					'check-requirements-undefined'
				);
			} );

			it( 'should return registered notifications filtered by their dismissal status when specified', async () => {
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification(
						'is-dismissible-true-and-dismissed',
						{
							Component: TestNotificationComponent,
							areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
							viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
							isDismissible: true,
						}
					);

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification(
						'is-dismissible-true-but-not-dismissed',
						{
							Component: TestNotificationComponent,
							areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
							viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
							isDismissible: true,
						}
					);

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'is-dismissible-false', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: false,
					} );

				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'is-dismissible-undefined', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [
					'is-dismissible-true-and-dismissed',
					'is-dismissible-false', // should not be checked nor filtered
					'is-dismissible-undefined', // should not be checked nor filtered
				] );

				registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				const queuedNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );
				expect( queuedNotifications ).toHaveLength( 3 );
				expect( queuedNotifications[ 0 ].id ).toBe(
					'is-dismissible-true-but-not-dismissed'
				);
				expect( queuedNotifications[ 1 ].id ).toBe(
					'is-dismissible-false'
				);
				expect( queuedNotifications[ 2 ].id ).toBe(
					'is-dismissible-undefined'
				);
			} );

			it( 'should return registered notifications ordered by priority', async () => {
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'medium-2-priority', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						priority: 25,
					} );
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'lowest-priority', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						priority: 30,
					} );
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'medium-1-priority', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						priority: 20,
					} );
				registry
					.dispatch( CORE_NOTIFICATIONS )
					.registerNotification( 'highest-priority', {
						Component: TestNotificationComponent,
						areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					} );

				registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				const queuedNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getQueuedNotifications( VIEW_CONTEXT_MAIN_DASHBOARD );

				expect( queuedNotifications ).toHaveLength( 4 );
				expect( queuedNotifications[ 0 ].id ).toBe(
					'highest-priority'
				);
				expect( queuedNotifications[ 1 ].id ).toBe(
					'medium-1-priority'
				);
				expect( queuedNotifications[ 2 ].id ).toBe(
					'medium-2-priority'
				);
				expect( queuedNotifications[ 3 ].id ).toBe( 'lowest-priority' );
			} );
		} );
		describe( 'isNotificationDismissed', () => {
			it( 'should return undefined if getDismissedItems selector is not resolved yet', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'foo' )
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getDismissedItems();
			} );

			it( 'should return TRUE if the notification is dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'foo' )
				).toBe( true );
			} );

			it( 'should return FALSE if the notification is not dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect(
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( 'baz' )
				).toBe( false );
			} );
		} );
	} );
} );
