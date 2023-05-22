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
import { createReducer } from '../../../../js/googlesitekit/data/create-reducer';

const REGISTER_NOTIFICATION = 'REGISTER_NOTIFICATION';

export const initialState = {
	notifications: {},
};

export const actions = {
	registerNotification( id, { type, shouldDisplay, Component } ) {
		return {
			payload: {
				id,
				settings: {
					type,
					shouldDisplay,
					Component,
				},
			},
			type: REGISTER_NOTIFICATION,
		};
	},

	dismissNotification() {},
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

				return state;
			}

			state.notifications[ id ] = { ...settings, id };
			return state;
		}

		default: {
			return state;
		}
	}
} );

export const resolvers = {};

export const selectors = {
	getNotifications( state ) {
		return state.notifications;
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
