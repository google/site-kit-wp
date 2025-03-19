/**
 * `modules/ads` data store: woocommerce
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * External dependencies.
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { commonActions, createReducer } from 'googlesitekit-data';
import { ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY } from './constants';
import { getItem } from '../../../googlesitekit/api/cache';

// Actions.
const RECEIVE_WOOCOMMERCE_MODAL_CACHE_KEY =
	'RECEIVE_WOOCOMMERCE_MODAL_CACHE_KEY';

const initialState = {
	woocommerceModalDismissed: false,
};

const actions = {
	/**
	 * Stores woocommerce modal dismissal in the datastore.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} cacheHit Boolean property extracted fro mthe cache item.
	 * @return {Object} Redux-style action.
	 */
	receiveIsWooCommerceRedirectModalDismissed( cacheHit ) {
		invariant( cacheHit !== undefined, 'A cacheHit is required.' );

		return {
			type: RECEIVE_WOOCOMMERCE_MODAL_CACHE_KEY,
			payload: {
				cacheHit,
			},
		};
	},
};

const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_WOOCOMMERCE_MODAL_CACHE_KEY:
			state.woocommerceModalDismissed = payload.cacheHit;
			break;

		default:
			break;
	}
} );

const selectors = {
	/**
	 * Gets the WooCommerce modal dismissal status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean)} WooCommerce modal dismissed status.
	 */
	isWooCommerceRedirectModalDismissed( state ) {
		return state.woocommerceModalDismissed;
	},
};

const resolvers = {
	*isWooCommerceRedirectModalDismissed() {
		const { cacheHit } = yield commonActions.await(
			getItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY )
		);

		yield actions.receiveIsWooCommerceRedirectModalDismissed(
			cacheHit || false
		);
	},
};

export default {
	initialState,
	actions,
	reducer,
	resolvers,
	selectors,
};
