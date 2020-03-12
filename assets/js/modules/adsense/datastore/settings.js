/**
 * modules/adsense data store: settings
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import { STORE_NAME } from './name';

// Actions
const SET_ACCOUNT_ID = 'SET_ACCOUNT_ID';

export const INITIAL_STATE = {};

export const actions = {
	setAccountStatus( value ) {
		invariant( value, 'value is required.' );

		return {
			payload: { value },
			type: SET_ACCOUNT_ID,
		};
	},
};

export const controls = {};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

const getSetting = ( name ) => {
	const settings = Data.select( STORE_NAME ).getSettings();

	if ( 'undefined' === typeof settings ) {
		return settings;
	}

	return settings[ name ];
};

export const selectors = {
	getAccountID() {
		return getSetting( 'accountID' );
	},

	getClientID() {
		return getSetting( 'clientID' );
	},

	getUseSnippet() {
		return getSetting( 'useSnippet' );
	},

	getAccountStatus() {
		return getSetting( 'accountStatus' );
	},

	getSiteStatus() {
		return getSetting( 'siteStatus' );
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
