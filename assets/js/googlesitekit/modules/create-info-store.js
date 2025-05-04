/**
 * `core/modules` data store: info.
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

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	createRegistryControl,
	createRegistrySelector,
} from 'googlesitekit-data';
import { CORE_SITE } from '../datastore/site/constants';
import { CORE_USER } from '../datastore/user/constants';

// Actions
const WAIT_FOR_REAUTH_RESOLVERS = 'WAIT_FOR_REAUTH_RESOLVERS';

/**
 * Creates a store object that has selectors for managing site info.
 *
 * @since 1.10.0
 * @private
 *
 * @param {string}  slug                 Slug of the module that the store is for.
 * @param {Object}  args                 Arguments to configure the store.
 * @param {number}  args.storeName       Store name to use.
 * @param {boolean} [args.requiresSetup] Optional. Store flag, for requires setup. Default is 'true'.
 * @return {Object} The info store object.
 */
export const createInfoStore = (
	slug,
	{ storeName = undefined, requiresSetup = true } = {}
) => {
	invariant( storeName, 'storeName is required.' );

	const initialState = {};
	const actions = {};
	const controls = {
		[ WAIT_FOR_REAUTH_RESOLVERS ]: createRegistryControl(
			( registry ) => async () => {
				const { resolveSelect } = registry;
				const { getAuthentication, getConnectURL } =
					resolveSelect( CORE_USER );
				const { getSiteInfo } = resolveSelect( CORE_SITE );

				await Promise.all( [
					// Authentication is needed for checking `needsReauthentication`.
					getAuthentication(),
					// Site info is needed for the `adminURL`.
					getSiteInfo(),
					// `connectURL` is needed for the `reAuthURL` when reauthentication
					// is needed.
					getConnectURL(),
				] );
			}
		),
	};
	const reducer = ( state ) => {
		return state;
	};
	const resolvers = {
		*getAdminReauthURL() {
			yield {
				type: WAIT_FOR_REAUTH_RESOLVERS,
			};
		},
	};
	const selectors = {
		/**
		 * Returns admin screen URL.
		 *
		 * @since 1.10.0
		 *
		 * @param {(Object|undefined)} queryArgs Query arguments to add to admin URL.
		 * @return {(string|undefined)} The admin screen URL.
		 */
		getAdminScreenURL: createRegistrySelector(
			( select ) => ( state, queryArgs ) => {
				return select( CORE_SITE ).getAdminURL(
					'googlesitekit-dashboard',
					queryArgs
				);
			}
		),

		/**
		 * Returns admin reauthentication URL.
		 *
		 * @since 1.10.0
		 *
		 * @param {boolean} reAuth The module activation status. Default is true.
		 * @return {(string|undefined)} The admin reauthentication URL, or
		 *                              undefined if not loaded yet.
		 */
		getAdminReauthURL: createRegistrySelector(
			( select ) =>
				( state, reAuth = true ) => {
					const needsReauthentication =
						select( CORE_USER ).needsReauthentication();
					if ( needsReauthentication === undefined ) {
						return undefined;
					}

					const noSetupQueryArgs = {};
					if ( ! requiresSetup && reAuth === true ) {
						noSetupQueryArgs.notification =
							'authentication_success';
						noSetupQueryArgs.reAuth = undefined;
					}

					const redirectURL = select( storeName ).getAdminScreenURL( {
						slug,
						reAuth,
						...noSetupQueryArgs,
					} );
					if ( redirectURL === undefined ) {
						return undefined;
					}

					if ( ! needsReauthentication ) {
						return redirectURL;
					}

					const connectURL = select( CORE_USER ).getConnectURL( {
						redirectURL,
					} );

					return addQueryArgs( connectURL, { status: reAuth } );
				}
		),
	};

	return {
		STORE_NAME: storeName,
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};
