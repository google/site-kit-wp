/**
 * `core/ui` data store: ui data
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject, isBoolean } from 'lodash';

/**
 * Internal dependencies
 */
import { commonActions } from 'googlesitekit-data';
import { CORE_UI } from './constants';
import { CORE_USER } from '../user/constants';

const SET_VALUES = 'SET_VALUES';
const SET_VALUE = 'SET_VALUE';

export const initialState = {
	useInViewResetCount: 0,
	isOnline: true,
};

export const actions = {
	/**
	 * Resets all `useInView` hooks that have the `sticky` param set to `true`.
	 *
	 * @since 1.46.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetInViewHook() {
		const registry = yield commonActions.getRegistry();

		const useInViewResetCount = registry
			.select( CORE_UI )
			.getValue( 'useInViewResetCount' );

		return yield actions.setValue(
			'useInViewResetCount',
			useInViewResetCount + 1
		);
	},

	/**
	 * Sets `isOnline` state.
	 *
	 * @since 1.118.0
	 * @private
	 *
	 * @param {boolean} value `isOnline` status.
	 * @return {Object} Redux-style action.
	 */
	setIsOnline( value ) {
		invariant( isBoolean( value ), 'value must be boolean.' );

		return actions.setValue( 'isOnline', value );
	},

	/**
	 * Sets `activeOverlayNotification` state.
	 *
	 * @since 1.123.0
	 * @private
	 *
	 * @param {string} overlayNotification Overlay notification component name.
	 * @return {Object} Redux-style action.
	 */
	*setOverlayNotificationToShow( overlayNotification ) {
		invariant( overlayNotification, 'overlayNotification is required.' );

		const registry = yield commonActions.getRegistry();

		const activeOverlayNotification = registry
			.select( CORE_UI )
			.getValue( 'activeOverlayNotification' );

		// If `activeOverlayNotification` is already set, don't override it.
		if ( activeOverlayNotification ) {
			return;
		}

		return yield actions.setValue(
			'activeOverlayNotification',
			overlayNotification
		);
	},

	/**
	 * Resets the `activeOverlayNotification` state and dismiss the overlay from
	 * the user's profile.
	 *
	 * @since 1.123.0
	 * @private
	 *
	 * @param {string} overlayNotification Overlay notification component name.
	 * @return {Object} Redux-style action.
	 */
	*dismissOverlayNotification( overlayNotification ) {
		invariant( overlayNotification, 'overlayNotification is required.' );

		const registry = yield commonActions.getRegistry();

		const activeOverlayNotification = registry
			.select( CORE_UI )
			.getValue( 'activeOverlayNotification' );

		yield commonActions.await(
			registry.dispatch( CORE_USER ).dismissItem( overlayNotification )
		);

		if (
			activeOverlayNotification &&
			overlayNotification === activeOverlayNotification
		) {
			return yield actions.setValues( {
				activeOverlayNotification: undefined,
			} );
		}
	},

	/**
	 * Stores site ui information.
	 *
	 * @since 1.27.0
	 * @private
	 *
	 * @param {Object} values Ui data supplied as a map of keys to set and their respective values.
	 * @return {Object} Redux-style action.
	 */
	setValues( values ) {
		invariant( isPlainObject( values ), 'values must be an object.' );

		return {
			payload: { values },
			type: SET_VALUES,
		};
	},

	/**
	 * Sets a particular value for a key.
	 *
	 * @since 1.27.0
	 * @private
	 *
	 * @param {string} key   Ui key to set the value for.
	 * @param {*}      value The value for the key.
	 * @return {Object} Redux-style action.
	 */
	setValue( key, value ) {
		invariant( key, 'key is required.' );

		return {
			payload: { key, value },
			type: SET_VALUE,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_VALUES: {
			const { values } = payload;

			return {
				...state,
				...values,
			};
		}

		case SET_VALUE: {
			const { key, value } = payload;

			return {
				...state,
				[ key ]: value,
			};
		}

		default: {
			return state;
		}
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the existing data by key.
	 *
	 * @since 1.27.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} key   Get data stored in this key.
	 * @return {*} Value stored in state by key. Returns `undefined` if key isn't found.
	 */
	getValue( state, key ) {
		return state[ key ];
	},

	/**
	 * Gets the existing useInView hook reset count.
	 *
	 * @since 1.46.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {number} Number of times `useInView` hooks have been reset.
	 */
	getInViewResetCount( state ) {
		return state.useInViewResetCount;
	},

	/**
	 * Gets the `isOnline` status.
	 *
	 * @since 1.118.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `isOnline` value.
	 */
	getIsOnline( state ) {
		return state.isOnline;
	},

	/**
	 * Returns `true` if the overlay notification name passed is currently
	 * active, `false` otherwise.
	 *
	 * @since 1.123.0
	 * @private
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} overlayNotification Overlay notification name.
	 * @return {boolean} `true` if the overlay notification is currently active.
	 */
	isShowingOverlayNotification( state, overlayNotification ) {
		return state.activeOverlayNotification === overlayNotification;
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
