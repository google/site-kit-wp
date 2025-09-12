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
	provideNotifications,
	untilResolved,
} from '../../../../../tests/js/utils';
import { render, waitFor } from '../../../../../tests/js/test-utils';
import { CORE_NOTIFICATIONS } from './constants';
import {
	NOTIFICATION_GROUPS,
	NOTIFICATION_AREAS,
} from '@/js/googlesitekit/notifications/constants';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { dismissedPromptsEndpoint } from '../../../../../tests/js/mock-dismiss-prompt-endpoints';

describe( 'core/notifications Notifications', () => {
	const fetchGetDismissedItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	let registry;
	let store;
	let insertNotificationIntoResolvedQueue;
	let registerNotification;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_NOTIFICATIONS ].store;
		( { insertNotificationIntoResolvedQueue, registerNotification } =
			registry.dispatch( CORE_NOTIFICATIONS ) );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	} );

	describe( 'actions', () => {
		describe( 'insertNotificationIntoResolvedQueue', () => {
			const id = 'test-notification-id';
			function TestNotificationComponent( props ) {
				return <div>Hello { props.children }!</div>;
			}

			it( 'should not try to insert an unregistered notification', () => {
				insertNotificationIntoResolvedQueue( id );

				const { queuedNotifications } = store.getState();

				expect( console ).toHaveWarnedWith(
					'Could not add notification with ID "test-notification-id" to queue. Notification "test-notification-id" is not registered.'
				);
				expect( queuedNotifications ).toEqual( {} );
			} );

			it( 'should not try to insert a notification into an unresolved queue', () => {
				// Register the notification so it can be added.
				registerNotification( id, {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 11,
					isDismissible: false,
				} );

				insertNotificationIntoResolvedQueue( id );

				const { queuedNotifications } = store.getState();

				expect( queuedNotifications ).toEqual( {} );
			} );
		} );

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
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ 'some-random-view-context' ],
					} )
				).toThrow( 'Notification view context should be one of:' );
			} );

			it( 'should register the notification with the given settings and component', () => {
				registerNotification( id, {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					NOTIFICATION_AREAS.HEADER
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );

				registerNotification( id, {
					Component: NotificationOneRedone,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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

			it( 'should add the notification to the queue if the queue is already resolved', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				expect(
					getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.DEFAULT
					)
				).toEqual( [] );

				registerNotification( id, {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 11,
					checkRequirements: () => true,
					isDismissible: false,
				} );

				insertNotificationIntoResolvedQueue( id );

				expect(
					getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.DEFAULT
					)
				).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "checkRequirements": [Function],
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "test-notification-id",
			    "isDismissible": false,
			    "priority": 11,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			  },
			]
		` );
			} );

			it( 'should place the notification at the end of the queue if it is the lowest priority', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );

				registerNotification( 'first', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 5,
					isDismissible: false,
				} );

				registerNotification( 'second', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
					isDismissible: false,
				} );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				registerNotification( id, {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 20,
					isDismissible: false,
				} );

				// Wait for the queue to be updated by the `registerNotification`
				// action.
				await waitFor( () => {
					expect(
						getQueuedNotifications(
							VIEW_CONTEXT_MAIN_DASHBOARD,
							NOTIFICATION_GROUPS.DEFAULT
						)
					).toHaveLength( 3 );
				} );

				expect(
					getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.DEFAULT
					)
				).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "first",
			    "isDismissible": false,
			    "priority": 5,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "second",
			    "isDismissible": false,
			    "priority": 10,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "test-notification-id",
			    "isDismissible": false,
			    "priority": 20,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			]
		` );
			} );

			it( 'should place the notification in between two notifications of lower/higher priority', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );

				registerNotification( 'first', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 5,
					isDismissible: false,
				} );

				registerNotification( 'second', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
					isDismissible: false,
				} );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				registerNotification( 'in-between', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 6,
					isDismissible: false,
				} );

				// Wait for the queue to be updated by the `registerNotification`
				// action.
				await waitFor( () => {
					expect(
						getQueuedNotifications(
							VIEW_CONTEXT_MAIN_DASHBOARD,
							NOTIFICATION_GROUPS.DEFAULT
						)
					).toHaveLength( 3 );
				} );

				expect(
					getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.DEFAULT
					)
				).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "first",
			    "isDismissible": false,
			    "priority": 5,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "in-between",
			    "isDismissible": false,
			    "priority": 6,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "second",
			    "isDismissible": false,
			    "priority": 10,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			]
		` );
			} );

			it( 'should place the notification in the front of the queue when it has the highest priority', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );

				registerNotification( 'first', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 5,
					isDismissible: false,
				} );

				registerNotification( 'second', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
					isDismissible: false,
				} );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				);

				registerNotification( 'in-between', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 1,
					isDismissible: false,
				} );

				// Wait for the queue to be updated by the `registerNotification`
				// action.
				await waitFor( () => {
					expect(
						getQueuedNotifications(
							VIEW_CONTEXT_MAIN_DASHBOARD,
							NOTIFICATION_GROUPS.DEFAULT
						)
					).toHaveLength( 3 );
				} );

				expect(
					getQueuedNotifications(
						VIEW_CONTEXT_MAIN_DASHBOARD,
						NOTIFICATION_GROUPS.DEFAULT
					)
				).toMatchInlineSnapshot( `
			Array [
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "in-between",
			    "isDismissible": false,
			    "priority": 1,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "first",
			    "isDismissible": false,
			    "priority": 5,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			  Object {
			    "Component": [Function],
			    "areaSlug": "notification-area-header",
			    "check": [Function],
			    "checkRequirements": undefined,
			    "dismissRetries": 0,
			    "featureFlag": "",
			    "groupID": "default",
			    "id": "second",
			    "isDismissible": false,
			    "priority": 10,
			    "viewContexts": Array [
			      "mainDashboard",
			    ],
			    "viewCount": 0,
			  },
			]
		` );
			} );
		} );

		describe( 'markNotificationSeen', () => {
			let markNotificationSeen;

			beforeEach( () => {
				( { markNotificationSeen } =
					registry.dispatch( CORE_NOTIFICATIONS ) );

				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-29' );

				function TestNotificationComponent() {
					return <div>Test notification!</div>;
				}
				registerNotification( 'test-notification-id', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );
				registerNotification( 'test-undismissible-notification-id', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: false,
				} );
			} );

			it( 'requires notificationID', () => {
				expect( () => markNotificationSeen() ).toThrow(
					'a valid notification ID is required to mark a notification as seen.'
				);
			} );

			it( 'should return void if notification is not dismissible', async () => {
				const result = await markNotificationSeen(
					'test-undismissible-notification-id'
				);

				expect( result ).toBeUndefined();
			} );

			it( 'should mark a notification as seen', async () => {
				await markNotificationSeen( 'test-notification-id' );

				const seenDates = registry
					.select( CORE_NOTIFICATIONS )
					.getNotificationSeenDates( 'test-notification-id' );

				expect( seenDates ).toEqual( [ '2025-04-29' ] );
			} );

			it( 'should mark a notification as seen on multiple days', async () => {
				await markNotificationSeen( 'test-notification-id' );
				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-30' );
				await markNotificationSeen( 'test-notification-id' );

				const seenDates = registry
					.select( CORE_NOTIFICATIONS )
					.getNotificationSeenDates( 'test-notification-id' );

				expect( seenDates ).toEqual( [ '2025-04-29', '2025-04-30' ] );
			} );

			it( 'should not mark duplicate seen dates', async () => {
				await markNotificationSeen( 'test-notification-id' );
				await markNotificationSeen( 'test-notification-id' );
				await markNotificationSeen( 'test-notification-id' );

				const seenDates = registry
					.select( CORE_NOTIFICATIONS )
					.getNotificationSeenDates( 'test-notification-id' );

				expect( seenDates ).toEqual( [ '2025-04-29' ] );
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
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

		describe( 'pinNotification', () => {
			it( 'should require a notification ID to be provided', () => {
				const { pinNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				expect( () => pinNotification() ).toThrow(
					'A notification id is required to pin a notification.'
				);
			} );

			it( 'should require a group ID to be provided', () => {
				const { pinNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				expect( () => pinNotification( 'some-notification' ) ).toThrow(
					'A groupID is required to pin a notification to a specific group.'
				);
			} );

			it( 'should pin a notification to the front of the queue for its group', async () => {
				function TestNotificationComponent() {
					return <div>Test notification!</div>;
				}

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				registerNotification( 'low-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 20,
					groupID: 'test-group',
					isDismissible: true,
				} );

				registerNotification( 'high-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 1,
					groupID: 'test-group',
					isDismissible: true,
				} );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				let queuedNotifications = getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual( [
					'high-priority',
					'low-priority',
				] );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.pinNotification( 'low-priority', 'test-group' );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.invalidateResolution( 'getQueuedNotifications', [
						VIEW_CONTEXT_MAIN_DASHBOARD,
						'test-group',
					] );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				queuedNotifications = getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual( [
					'low-priority',
					'high-priority',
				] );
			} );
		} );

		describe( 'unpinNotification', () => {
			it( 'should require a notification ID to be provided', () => {
				const { unpinNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				expect( () => unpinNotification() ).toThrow(
					'A notification id is required to unpin a notification.'
				);
			} );

			it( 'should require a group ID to be provided', () => {
				const { unpinNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				expect( () =>
					unpinNotification( 'some-notification' )
				).toThrow(
					'A groupID is required to unpin notification from a specific group.'
				);
			} );

			it( 'should unpin a notification if it is pinned', async () => {
				function TestNotificationComponent() {
					return <div>Test notification!</div>;
				}

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				registerNotification( 'low-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 20,
					groupID: 'test-group',
					isDismissible: true,
				} );

				registerNotification( 'high-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 1,
					groupID: 'test-group',
					isDismissible: true,
				} );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.pinNotification( 'low-priority', 'test-group' );

				const { getQueuedNotifications } =
					registry.select( CORE_NOTIFICATIONS );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				let queuedNotifications = getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual( [
					'low-priority',
					'high-priority',
				] );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.unpinNotification( 'low-priority', 'test-group' );

				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.invalidateResolution( 'getQueuedNotifications', [
						VIEW_CONTEXT_MAIN_DASHBOARD,
						'test-group',
					] );

				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				await untilResolved(
					registry,
					CORE_NOTIFICATIONS
				).getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				queuedNotifications = getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					'test-group'
				);

				expect( queuedNotifications.map( ( { id } ) => id ) ).toEqual( [
					'high-priority',
					'low-priority',
				] );
			} );
		} );
	} );

	describe( 'selectors', () => {
		function TestNotificationComponent() {
			return <div>Test notification!</div>;
		}

		describe( 'getSeenNotifications', () => {
			it( 'should return an empty object when no notifications have been seen', () => {
				const seenNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getSeenNotifications();

				expect( seenNotifications ).toEqual( {} );
			} );

			it( 'should return seen notifications with their dates viewed as an array', async () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-29' );
				registerNotification( 'notification-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );
				registerNotification( 'notification-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );
				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.markNotificationSeen( 'notification-1' );
				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.markNotificationSeen( 'notification-2' );

				// Change the reference date and mark notification-1 as seen again
				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-30' );
				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.markNotificationSeen( 'notification-1' );

				const seenNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getSeenNotifications();

				expect( seenNotifications ).toEqual( {
					'notification-1': [ '2025-04-29', '2025-04-30' ],
					'notification-2': [ '2025-04-29' ],
				} );
			} );
		} );

		describe( 'getNotificationSeenDates', () => {
			it( 'should return an empty array for notifications that have not been seen', () => {
				const seenDates = registry
					.select( CORE_NOTIFICATIONS )
					.getNotificationSeenDates( 'unseen-notification' );

				expect( seenDates ).toEqual( [] );
			} );

			it( 'should return an array of dates for seen notifications', async () => {
				registerNotification( 'notification-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-29' );
				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.markNotificationSeen( 'notification-1' );

				registry.dispatch( CORE_USER ).setReferenceDate( '2025-04-30' );
				await registry
					.dispatch( CORE_NOTIFICATIONS )
					.markNotificationSeen( 'notification-1' );

				const seenDates = registry
					.select( CORE_NOTIFICATIONS )
					.getNotificationSeenDates( 'notification-1' );

				expect( seenDates ).toEqual( [ '2025-04-29', '2025-04-30' ] );
			} );
		} );

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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				} );
				registerNotification( 'test-notification-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_ENTITY_DASHBOARD ],
				} );
				registerNotification( 'test-notification-3', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
				} );
				registerNotification( 'setup-cta-1', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
					priority: 20,
				} );
				registerNotification( 'default-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 10,
				} );
				registerNotification( 'setup-cta-2', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testActiveNotification(),
				} );

				registerNotification( 'check-requirements-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testInactiveNotification(),
				} );

				registerNotification( 'check-requirements-errored-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					checkRequirements: ( { select } ) =>
						select( TEST_STORE ).testErroredInactiveNotification(),
				} );

				registerNotification( 'check-requirements-undefined', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				registerNotification( 'is-dismissible-true-but-not-dismissed', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: true,
				} );

				registerNotification( 'is-dismissible-false', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					isDismissible: false,
				} );

				registerNotification( 'is-dismissible-undefined', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 25,
				} );
				registerNotification( 'lowest-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 30,
				} );
				registerNotification( 'medium-1-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
					viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
					priority: 20,
				} );
				registerNotification( 'highest-priority', {
					Component: TestNotificationComponent,
					areaSlug: NOTIFICATION_AREAS.HEADER,
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
			describe( 'when using dismissed items', () => {
				let isNotificationDismissed;
				beforeEach( () => {
					// Register the Gathering Data Notification as a test
					provideNotifications( registry );

					( { isNotificationDismissed } =
						registry.select( CORE_NOTIFICATIONS ) );
				} );

				it( 'should return undefined if getDismissedItems selector is not resolved yet', async () => {
					fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
					expect(
						isNotificationDismissed( 'gathering-data-notification' )
					).toBeUndefined();
					await untilResolved(
						registry,
						CORE_USER
					).getDismissedItems();
				} );

				it( 'should return TRUE if the notification is dismissed', () => {
					registry
						.dispatch( CORE_USER )
						.receiveGetDismissedItems( [
							'gathering-data-notification',
							'some-other-notification',
						] );
					expect(
						isNotificationDismissed( 'gathering-data-notification' )
					).toBe( true );
				} );

				it( 'should return FALSE if the notification is not dismissed', () => {
					registry
						.dispatch( CORE_USER )
						.receiveGetDismissedItems( [ 'foo', 'bar' ] );
					expect(
						isNotificationDismissed( 'gathering-data-notification' )
					).toBe( false );
				} );
			} );
			describe( 'when using dismissed prompts', () => {
				let isNotificationDismissed;
				beforeEach( () => {
					provideNotifications( registry, [
						{
							id: 'test-notification-using-prompts',
							Component: () => {},
							areaSlug: NOTIFICATION_AREAS.HEADER,
							viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
							priority: 11,
							checkRequirements: () => true,
							isDismissible: false,
							dismissRetries: 1,
						},
					] );

					( { isNotificationDismissed } =
						registry.select( CORE_NOTIFICATIONS ) );
				} );

				it( 'should return undefined if getDismissedPrompts selector is not resolved yet', async () => {
					// Create a fresh registry for this test to ensure getDismissedPrompts is not resolved
					const testRegistry = createTestRegistry();

					// Register the notification on the new registry
					provideNotifications( testRegistry, [
						{
							id: 'test-notification-using-prompts',
							Component: () => {},
							areaSlug: NOTIFICATION_AREAS.HEADER,
							viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
							priority: 11,
							checkRequirements: () => true,
							isDismissible: false,
							dismissRetries: 1,
						},
					] );

					// Get the selector from the new registry
					const testIsNotificationDismissed =
						testRegistry.select(
							CORE_NOTIFICATIONS
						).isNotificationDismissed;

					fetchMock.getOnce( dismissedPromptsEndpoint, { body: [] } );
					expect(
						testIsNotificationDismissed(
							'test-notification-using-prompts'
						)
					).toBeUndefined();
					await untilResolved(
						testRegistry,
						CORE_USER
					).getDismissedPrompts();
				} );

				it( 'should return TRUE if the notification is dismissed', () => {
					registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
						'test-notification-using-prompts': {
							expires: 0,
							count: 1,
						},
						'some-other-notification': { expires: 0, count: 2 },
					} );
					expect(
						isNotificationDismissed(
							'test-notification-using-prompts'
						)
					).toBe( true );
				} );

				it( 'should return FALSE if the notification is not dismissed', () => {
					registry
						.dispatch( CORE_USER )
						.receiveGetDismissedPrompts( [ 'foo', 'bar' ] );
					expect(
						isNotificationDismissed(
							'test-notification-using-prompts'
						)
					).toBe( false );
				} );
			} );
		} );

		describe( 'isNotificationDismissalFinal', () => {
			let isNotificationDismissalFinal;
			beforeEach( () => {
				( { isNotificationDismissalFinal } =
					registry.select( CORE_NOTIFICATIONS ) );
			} );

			it( 'should return undefined if notification is undefined', () => {
				expect(
					isNotificationDismissalFinal( 'test-notification' )
				).toBeUndefined();
			} );

			it( 'requires notification to be dismissible', () => {
				provideNotifications( registry, [
					{
						id: 'test-notification',
						Component: () => {},
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						dismissRetries: 1,
					},
				] );

				expect( () =>
					isNotificationDismissalFinal( 'test-notification' )
				).toThrow(
					'Notification should be dismissible to check if a notification is on its final dismissal.'
				);
			} );

			it( 'returns true if notification does not have retries', () => {
				provideNotifications( registry, [
					{
						id: 'test-notification',
						Component: () => {},
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: true,
					},
				] );

				expect(
					isNotificationDismissalFinal( 'test-notification' )
				).toBe( true );
			} );

			it( 'returns true if notification is on the final retry', () => {
				provideNotifications( registry, [
					{
						id: 'test-notification',
						Component: () => {},
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: true,
						dismissRetries: 2,
					},
				] );

				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					'test-notification': {
						expires: 0,
						count: 2,
					},
					'some-other-notification': { expires: 0, count: 2 },
				} );

				expect(
					isNotificationDismissalFinal( 'test-notification' )
				).toBe( true );
			} );

			it( 'returns false if notification has never been dismissed', () => {
				provideNotifications( registry, [
					{
						id: 'test-notification',
						Component: () => {},
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: true,
						dismissRetries: 1,
					},
				] );

				expect(
					isNotificationDismissalFinal( 'test-notification' )
				).toBe( false );
			} );

			it( 'returns false if notification is not on the final retry', () => {
				provideNotifications( registry, [
					{
						id: 'test-notification',
						Component: () => {},
						areaSlug: NOTIFICATION_AREAS.HEADER,
						viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
						isDismissible: true,
						dismissRetries: 2,
					},
				] );

				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					'test-notification': {
						expires: 0,
						count: 1,
					},
					'some-other-notification': { expires: 0, count: 2 },
				} );

				expect(
					isNotificationDismissalFinal( 'test-notification' )
				).toBe( false );
			} );
		} );

		describe( 'getPinnedNotificationID', () => {
			it( 'should require a group ID', () => {
				const { getPinnedNotificationID } =
					registry.select( CORE_NOTIFICATIONS );

				expect( () => getPinnedNotificationID() ).toThrow(
					'groupID is required.'
				);
			} );

			it( 'should return undefined if no notification is pinned for the given group', () => {
				const { getPinnedNotificationID } =
					registry.select( CORE_NOTIFICATIONS );

				const pinnedNotificationID =
					getPinnedNotificationID( 'test-group' );

				expect( pinnedNotificationID ).toBeUndefined();
			} );

			it( 'should return the ID of the pinned notification for the given group', async () => {
				const { pinNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				const { getPinnedNotificationID } =
					registry.select( CORE_NOTIFICATIONS );

				expect(
					getPinnedNotificationID( 'test-group' )
				).toBeUndefined();

				await pinNotification( 'low-priority', 'test-group' );

				expect( getPinnedNotificationID( 'test-group' ) ).toBe(
					'low-priority'
				);

				await pinNotification( 'high-priority', 'test-group' );

				expect( getPinnedNotificationID( 'test-group' ) ).toBe(
					'high-priority'
				);
			} );
		} );
	} );
} );
