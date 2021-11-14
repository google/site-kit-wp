/**
 * `core/site` data store: notifications.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { actions, selectors } from './index';

import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site notifications', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		const response = true;
		fetchMock.post(
			/^\/google-site-kit\/v1\/core\/site\/data\/mark-notification/,
			{ body: JSON.stringify( response ), status: 200 }
		);
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'fetchMarkNotification', () => {
			it( 'properly marks notifications', async () => {
				expect( () =>
					registry.dispatch( CORE_SITE ).fetchMarkNotification( {
						notificationID: 'abc',
						notificationState: 'accepted',
					} )
				).not.toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).fetchMarkNotification( {
						notificationID: 'abc',
						notificationState: 'dismissed',
					} )
				).not.toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).fetchMarkNotification( {
						notificationID: 'abc',
						notificationState: 'test',
					} )
				).toThrow();
				expect( () =>
					registry
						.dispatch( CORE_SITE )
						.fetchMarkNotification( { notificationID: 'abc' } )
				).toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).fetchMarkNotification( {
						notificationState: 'accepted',
					} )
				).toThrow();
			} );
		} );
		describe( 'acceptNotification', () => {
			it( 'properly accepts notifications', async () => {
				expect( () =>
					registry.dispatch( CORE_SITE ).acceptNotification( 'abc' )
				).not.toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).acceptNotification()
				).toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).acceptNotification( true )
				).toThrow();
			} );
		} );
		describe( 'dismissNotification', () => {
			it( 'properly dismisses notifications', async () => {
				expect( () =>
					registry.dispatch( CORE_SITE ).dismissNotification( 'abc' )
				).not.toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).dismissNotification()
				).toThrow();
				expect( () =>
					registry.dispatch( CORE_SITE ).dissmissNotification( true )
				).toThrow();
			} );
		} );

		it( 'has appropriate notification actions', () => {
			const actionsToExpect = [
				'acceptNotification',
				'addNotification',
				'dismissNotification',
				'fetchMarkNotification',
				'removeNotification',
			];
			expect( Object.keys( actions ) ).toEqual(
				expect.arrayContaining( actionsToExpect )
			);
		} );
	} );

	describe( 'selectors', () => {
		it( 'has appropriate notification selectors', () => {
			const selectorsToExpect = [
				'getNotifications',
				'isFetchingGetNotifications',
				'isFetchingMarkNotification',
			];
			expect( Object.keys( selectors ) ).toEqual(
				expect.arrayContaining( selectorsToExpect )
			);
		} );
	} );
} );
