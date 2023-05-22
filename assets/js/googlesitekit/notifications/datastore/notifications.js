/**
 * `core/notifications` data store: notifications info.
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
import Data from 'googlesitekit-data';
import { createReducer } from '../../../../js/googlesitekit/data/create-reducer';
import { CORE_NOTIFICATIONS } from './constants';
import { CORE_USER } from '../../datastore/user/constants';

const { createRegistrySelector } = Data;

const REGISTER_NOTIFICATION = 'REGISTER_NOTIFICATION';
const RECEIVE_ACTIVE_IDS = 'RECEIVE_ACTIVE_IDS';

export const initialState = {
	notifications: {},
	activeIDs: undefined,
};

export const actions = {
	registerNotification(
		id,
		{ type, shouldDisplay, Component, dismissable }
	) {
		return {
			payload: {
				id,
				settings: {
					type,
					shouldDisplay,
					Component,
					dismissable,
				},
			},
			type: REGISTER_NOTIFICATION,
		};
	},

	receiveActiveIDs( activeIDs ) {
		return {
			payload: {
				activeIDs,
			},
			type: RECEIVE_ACTIVE_IDS,
		};
	},
};

export const controls = {};

export const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case REGISTER_NOTIFICATION: {
			const { id, settings } = payload;

			if ( state.notifications[ id ] !== undefined ) {
				global.console.warn(
					`Could not register notification with ID "${ id }". Notification "${ id }" is already registered.`
				);
			} else {
				state.notifications[ id ] = { ...settings, id };
			}

			break;
		}

		case RECEIVE_ACTIVE_IDS: {
			state.activeIDs = payload.activeIDs;
			break;
		}

		default:
			break;
	}
} );

export const resolvers = {
	*getActiveNotifications() {
		const registry = yield Data.commonActions.getRegistry();

		const notifications = registry
			.select( CORE_NOTIFICATIONS )
			.getNotifications();

		const resolved = yield Data.commonActions.await(
			Promise.all(
				notifications.map( ( notification ) =>
					notification.shouldDisplay( registry )
				)
			)
		);

		const activeIDs = [];
		notifications.forEach( ( notification, idx ) => {
			if ( resolved[ idx ] ) {
				activeIDs.push( notification.id );
			}
		} );

		yield actions.receiveActiveIDs( activeIDs );
	},
};

export const selectors = {
	getNotifications: createRegistrySelector( ( select ) => ( state ) => {
		const order = [ 'error', 'warning', 'info' ];

		return Object.values( state.notifications )
			.filter( ( notification ) => {
				if (
					notification.dismissable &&
					select( CORE_USER ).isItemDismissed( notification.id )
				) {
					return false;
				}

				return true;
			} )
			.sort( ( a, b ) => {
				return order.indexOf( a.type ) - order.indexOf( b.type );
			} );
	} ),

	getActiveNotifications: ( state ) => {
		if ( state.activeIDs === undefined ) {
			return undefined;
		}

		return selectors
			.getNotifications( state )
			.filter( ( notification ) =>
				state.activeIDs.includes( notification.id )
			);
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
