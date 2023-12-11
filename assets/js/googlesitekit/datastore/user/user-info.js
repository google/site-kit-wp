/**
 * `core/user` data store: user info
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
import Data from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { escapeURI } from '../../../util/escape-uri';

const { createRegistrySelector } = Data;

const RECEIVE_CONNECT_URL = 'RECEIVE_CONNECT_URL';
const RECEIVE_USER_INFO = 'RECEIVE_USER_INFO';
const RECEIVE_USER_IS_VERIFIED = 'RECEIVE_USER_IS_VERIFIED';
const RECEIVE_IS_USER_INPUT_COMPLETED = 'RECEIVE_IS_USER_INPUT_COMPLETED';
const RECEIVE_USER_INITIAL_SITE_KIT_VERSION =
	'RECEIVE_USER_INITIAL_SITE_KIT_VERSION';

const initialState = {
	connectURL: undefined,
	initialVersion: undefined,
	user: undefined,
	verified: undefined,
	isUserInputCompleted: undefined,
};

export const actions = {
	/**
	 * Stores the OAuth connection URL in the datastore.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {string} connectURL Full URL to the Site Kit googlesitekit_connect handler.
	 * @return {Object} Redux-style action.
	 */
	receiveConnectURL( connectURL ) {
		invariant( connectURL, 'connectURL is required.' );

		return {
			payload: {
				connectURL,
			},
			type: RECEIVE_CONNECT_URL,
		};
	},

	/**
	 * Stores user info in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitUserData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-user`.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} userInfo User info, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveUserInfo( userInfo ) {
		invariant( userInfo, 'userInfo is required.' );
		return {
			payload: {
				user: userInfo,
			},
			type: RECEIVE_USER_INFO,
		};
	},

	receiveInitialSiteKitVersion( initialVersion ) {
		invariant( initialVersion, 'initialVersion is required.' );
		return {
			payload: {
				initialVersion,
			},
			type: RECEIVE_USER_INITIAL_SITE_KIT_VERSION,
		};
	},

	/**
	 * Stores user verification status in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitUserData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-user`.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {boolean} userIsVerified User verification status, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveUserIsVerified( userIsVerified ) {
		invariant(
			userIsVerified !== undefined,
			'userIsVerified is required.'
		);
		return {
			payload: {
				verified: userIsVerified,
			},
			type: RECEIVE_USER_IS_VERIFIED,
		};
	},

	/**
	 * Stores the user input state in the datastore.
	 *
	 * @since 1.94.0
	 * @private
	 *
	 * @param {Object} isUserInputCompleted User input state.
	 * @return {Object} Redux-style action.
	 */
	receiveIsUserInputCompleted( isUserInputCompleted ) {
		invariant(
			isUserInputCompleted !== undefined,
			'The isUserInputCompleted param is required.'
		);
		return {
			payload: { isUserInputCompleted },
			type: RECEIVE_IS_USER_INPUT_COMPLETED,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_CONNECT_URL: {
			const { connectURL } = payload;
			return {
				...state,
				connectURL,
			};
		}
		case RECEIVE_USER_INFO: {
			const { user } = payload;
			return {
				...state,
				user,
			};
		}
		case RECEIVE_USER_INITIAL_SITE_KIT_VERSION: {
			const { initialVersion } = payload;
			return {
				...state,
				initialVersion,
			};
		}
		case RECEIVE_USER_IS_VERIFIED: {
			const { verified } = payload;
			return {
				...state,
				verified,
			};
		}
		case RECEIVE_IS_USER_INPUT_COMPLETED: {
			const { isUserInputCompleted } = payload;
			return {
				...state,
				isUserInputCompleted,
			};
		}
		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getConnectURL() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( CORE_USER ).getConnectURL() ) {
			return;
		}

		if ( ! global._googlesitekitUserData ) {
			global.console.error( 'Could not load core/user info.' );
			return;
		}
		const { connectURL } = global._googlesitekitUserData;

		yield actions.receiveConnectURL( connectURL );
	},

	*getUser() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( CORE_USER ).getUser() !== undefined ) {
			return;
		}

		if ( ! global._googlesitekitUserData ) {
			global.console.error( 'Could not load core/user info.' );
			return;
		}
		const { user } = global._googlesitekitUserData;
		yield actions.receiveUserInfo( user );
	},

	*getInitialSiteKitVersion() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( CORE_USER ).getInitialSiteKitVersion() !== undefined ) {
			return;
		}

		if ( ! global._googlesitekitUserData ) {
			global.console.error( 'Could not load core/user info.' );
			return;
		}

		const { initialVersion } = global._googlesitekitUserData;
		if ( initialVersion ) {
			yield actions.receiveInitialSiteKitVersion( initialVersion );
		}
	},

	*isVerified() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( CORE_USER ).isVerified() !== undefined ) {
			return;
		}

		if ( ! global._googlesitekitUserData ) {
			global.console.error( 'Could not load core/user info.' );
			return;
		}
		const { verified } = global._googlesitekitUserData;
		yield actions.receiveUserIsVerified( verified );
	},

	*isUserInputCompleted() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( undefined !== select( CORE_USER ).isUserInputCompleted() ) {
			return;
		}

		if ( ! global._googlesitekitUserData ) {
			global.console.error( 'Could not load core/user info.' );
			return;
		}
		const { isUserInputCompleted } = global._googlesitekitUserData;
		yield actions.receiveIsUserInputCompleted( isUserInputCompleted );
	},
};

export const selectors = {
	/**
	 * Gets the user info for the logged in user.
	 *
	 * Returns `undefined` if the user info is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   user: <Object>,
	 *   verified: <Boolean>,
	 * }
	 * ```
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User info.
	 */
	getUser( state ) {
		const { user } = state;
		return user;
	},
	/**
	 * Gets a URL for (re)connecting via OAuth, with optional additional scopes.
	 *
	 * @since 1.9.0
	 * @since 1.34.1 Updated resulting URL when additional scopes are provided.
	 *
	 * @param {Object}   state                   Data store's state.
	 * @param {Object}   [args]                  Optional arguments for the resulting URL.
	 * @param {string[]} [args.additionalScopes] Additional scopes to request.
	 * @param {string}   [args.redirectURL]      URL to redirect to after successful authentication.
	 * @return {(string|undefined)} Full URL to connect, or `undefined` if not loaded yet.
	 */
	getConnectURL(
		state,
		{ additionalScopes = [], redirectURL = undefined } = {}
	) {
		const { connectURL } = state;
		const queryArgs = { redirect: redirectURL };

		if ( connectURL === undefined ) {
			return undefined;
		}

		// If additional scopes are provided, pass them in the dedicated query param.
		if ( additionalScopes?.length ) {
			// Some hosts with aggressive security filters block URLs with query parameters
			// that begin with a URL. This will block these requests because most scopes
			// are valid URLs. As a workaround, we rewrite the scheme temporarily
			// and then restore it on the server before requesting scopes.
			const rewrittenScopes = additionalScopes.map( ( scope ) =>
				scope.replace( /^http(s)?:/, 'gttp$1:' )
			);
			return addQueryArgs( connectURL, {
				...queryArgs,
				additional_scopes: rewrittenScopes,
			} );
		}

		return addQueryArgs( connectURL, queryArgs );
	},

	/**
	 * Gets the ID for this user.
	 *
	 * Returns ID of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|undefined)} The user ID.
	 */
	getID: createRegistrySelector( ( select ) => () => {
		const user = select( CORE_USER ).getUser();
		return user !== undefined ? user.id : user;
	} ),

	/**
	 * Gets the Name for this user.
	 *
	 * Returns Name of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getName: createRegistrySelector( ( select ) => () => {
		const user = select( CORE_USER ).getUser();
		return user !== undefined ? user.name : user;
	} ),

	/**
	 * Gets the Email for this user.
	 *
	 * Returns email of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getEmail: createRegistrySelector( ( select ) => () => {
		const user = select( CORE_USER ).getUser();
		return user !== undefined ? user.email : user;
	} ),

	/**
	 * Gets the url to the picture for this user.
	 *
	 * Returns url of the user picture or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getPicture: createRegistrySelector( ( select ) => () => {
		const user = select( CORE_USER ).getUser();
		return user !== undefined ? user.picture : user;
	} ),

	/**
	 * Gets the full name name for this user.
	 *
	 * Returns full name of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.86.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The user's full name; will be set to `null` if not available in the user's profile data and `undefined` while loading.
	 */
	getFullName: createRegistrySelector( ( select ) => () => {
		const user = select( CORE_USER ).getUser();

		if ( user === undefined ) {
			return undefined;
		}

		return user.full_name;
	} ),

	/**
	 * Gets an account chooser url with the current user's email.
	 *
	 * @since 1.80.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The concatenated url if an email is present; otherwise undefined.
	 */
	getAccountChooserURL: createRegistrySelector(
		( select ) => ( state, destinationURL ) => {
			invariant( destinationURL, 'destinationURL is required' );

			const userEmail = select( CORE_USER ).getEmail();
			if ( userEmail === undefined ) {
				return undefined;
			}

			// The `Email` parameter is case sensitive;
			// the capital E is required for the account chooser URL.
			return escapeURI`https://accounts.google.com/accountchooser?continue=${ destinationURL }&Email=${ userEmail }`;
		}
	),

	/**
	 * Gets the initial version that the user used Site Kit with.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} `string` Site Kit version number,
	 *                              `undefined` if not resolve yet.
	 */
	getInitialSiteKitVersion( state ) {
		return state.initialVersion;
	},

	/**
	 * Gets the verified status for this user.
	 *
	 * Returns the true if the user is verified, false if not verified, or `undefined` if the user info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} The user ID.
	 */
	isVerified( state ) {
		const { verified } = state;
		return verified;
	},

	/**
	 * Gets the user input state.
	 *
	 * @since 1.94.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} The user input state.
	 */
	isUserInputCompleted( state ) {
		const { isUserInputCompleted } = state;
		return isUserInputCompleted;
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
