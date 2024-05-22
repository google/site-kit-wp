/**
 * `core/user` data store: expirable items
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';
const { createRegistrySelector, commonActions } = Data;
const { getRegistry } = commonActions;

function reducerCallback( state, expirableItems ) {
	return {
		...state,
		expirableItems,
	};
}

const fetchGetExpirableItemsStore = createFetchStore( {
	baseName: 'getExpirableItems',
	controlCallback: () =>
		API.get( 'core', 'user', 'expirable-items', {}, { useCache: false } ),
	reducerCallback,
} );

const fetchSetExpirableItemTimersStore = createFetchStore( {
	baseName: 'setExpirableItemTimers',
	controlCallback: ( items ) =>
		API.set( 'core', 'user', 'set-expirable-item-timers', items ),
	reducerCallback,
	argsToParams: ( items = [] ) => {
		return items.map( ( item ) => {
			const { slug, expiresInSeconds } = item;

			return {
				slug,
				expiration: expiresInSeconds,
			};
		} );
	},
	validateParams: ( items ) => {
		invariant( Array.isArray( items ), 'items are required.' );

		items.forEach( ( item ) => {
			const { slug, expiresInSeconds = 0 } = item;
			invariant( slug, 'slug is required.' );
			invariant(
				Number.isInteger( expiresInSeconds ),
				'expiresInSeconds must be an integer.'
			);
		} );
	},
} );

const baseInitialState = {
	expirableItems: undefined,
};

const baseActions = {
	setExpirableItemTimers: createValidatedAction(
		( items = [] ) => {
			items.forEach( ( item ) => {
				const { slug, expiresInSeconds } = item;

				invariant( slug, 'An item slug is required.' );
				invariant(
					Number.isInteger( expiresInSeconds ),
					'expiresInSeconds must be an integer.'
				);
			} );
		},
		function ( items ) {
			return fetchSetExpirableItemTimersStore.actions.fetchSetExpirableItemTimers(
				items
			);
		}
	),
};

const baseResolvers = {
	*getExpirableItems() {
		const { select } = yield getRegistry();
		const expirableItems = select( CORE_USER ).getExpirableItems();
		if ( expirableItems === undefined ) {
			yield fetchGetExpirableItemsStore.actions.fetchGetExpirableItems();
		}
	},
};

const baseSelectors = {
	/**
	 * Returns the expirable items.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} Items if exists, `undefined` if not resolved yet.
	 */
	getExpirableItems( state ) {
		return state.expirableItems;
	},

	/**
	 * Determines whether the item exists in expirable items.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Item slug.
	 * @return {(boolean|undefined)} TRUE if exists, otherwise FALSE, `undefined` if not resolved yet.
	 */
	hasExpirableItem: createRegistrySelector( ( select ) => ( state, slug ) => {
		const expirableItems = select( CORE_USER ).getExpirableItems();

		if ( expirableItems === undefined ) {
			return undefined;
		}

		return expirableItems.hasOwnProperty( slug );
	} ),

	/**
	 * Determines whether the item is active and not expired.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Item slug.
	 * @return {(boolean|undefined)} TRUE if exists, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isExpirableItemActive: createRegistrySelector(
		( select ) => ( state, slug ) => {
			const expirableItems = select( CORE_USER ).getExpirableItems();

			if ( expirableItems === undefined ) {
				return undefined;
			}

			const expiresInSeconds = expirableItems[ slug ];

			if ( expiresInSeconds === undefined ) {
				return false;
			}

			return expiresInSeconds > Math.floor( Date.now() / 1000 );
		}
	),
};

export const {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
} = Data.combineStores(
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	},
	fetchGetExpirableItemsStore,
	fetchSetExpirableItemTimersStore
);

export default {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
};
