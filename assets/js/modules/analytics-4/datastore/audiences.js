/**
 * `modules/analytics-4` data store: audiences.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '../../../googlesitekit/data/utils';

const audienceFields = [
	'name',
	'displayName',
	'description',
	'membershipDurationDays',
	'adsPersonalizationEnabled',
	'eventTrigger',
	'exclusionDurationMode',
	'filterClauses',
];

function validateAudience( audience ) {
	invariant( isPlainObject( audience ), 'Audience must be an object.' );
	Object.keys( audience ).forEach( ( key ) => {
		invariant(
			audienceFields.includes( key ),
			`Audience must contain only valid keys. Invalid key: "${ key }"`
		);
	} );
}

const fetchGetAudiencesStore = createFetchStore( {
	baseName: 'getAudiences',
	controlCallback() {
		return API.get(
			'modules',
			'analytics-4',
			'audiences',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, audiences ) {
		return { ...state, audiences };
	},
} );

const fetchCreateAudienceStore = createFetchStore( {
	baseName: 'createAudience',
	controlCallback: ( { audience } ) =>
		API.set( 'modules', 'analytics-4', 'create-audience', {
			audience,
		} ),
	reducerCallback( state, audiences ) {
		return { ...state, audiences };
	},
	argsToParams: ( audience ) => ( {
		audience,
	} ),
	validateParams: ( { audience } ) => {
		validateAudience( audience );
	},
} );

const baseInitialState = {
	audiences: [],
};

const baseActions = {
	/**
	 * Creates new property audience.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} audience The property audience parameters.
	 * @return {Object} Redux-style action.
	 */
	createAudience: createValidatedAction(
		( audience ) => {
			validateAudience( audience );
		},
		function* ( audience ) {
			return yield fetchCreateAudienceStore.actions.fetchCreateAudience(
				audience
			);
		}
	),
};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {};

const baseSelectors = {};

const store = Data.combineStores(
	fetchGetAudiencesStore,
	fetchCreateAudienceStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
