/**
 * `modules/optimize` data store: settings.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import { createStrictSelect, createValidationSelector } from '../../../googlesitekit/data/utils';
import {
	isValidOptimizeID,
	isValidAMPExperimentJSON,
} from '../util';
import { STORE_NAME } from './constants';

const { createRegistryControl } = Data;

// Invariant error messages.
export const INVARIANT_DOING_SUBMIT_CHANGES = 'cannot submit changes while submitting changes';
export const INVARIANT_SETTINGS_NOT_CHANGED = 'cannot submit changes if settings have not changed';
export const INVARIANT_INVALID_AMP_EXPERIMENT_JSON = 'ampExperimentJSON must be valid JSON if set';
export const INVARIANT_INVALID_OPTIMIZE_ID = 'a valid optimizeID is required';

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

export const initialState = {
	isDoingSubmitChanges: false,
};

export const actions = {
	/**
	 * Submits all changes currently present in the client, persisting them on the server.
	 *
	 * @since 1.10.0
	 *
	 * @return {Object} Empty object on success, object with `error` property on failure.
	 */
	*submitChanges() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: START_SUBMIT_CHANGES,
		};

		const result = yield {
			payload: {},
			type: SUBMIT_CHANGES,
		};

		if ( result.error ) {
			yield registry.dispatch( STORE_NAME ).receiveError( result.error, 'submitChanges', [] );
		}

		yield {
			payload: {},
			type: FINISH_SUBMIT_CHANGES,
		};

		return result;
	},
};

export const controls = {
	[ SUBMIT_CHANGES ]: createRegistryControl( ( registry ) => async () => {
		// This action shouldn't be called if settings haven't changed,
		// but this prevents errors in tests.
		if ( registry.select( STORE_NAME ).haveSettingsChanged() ) {
			const { error } = await registry.dispatch( STORE_NAME ).saveSettings();

			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', 'optimize' );
		// TODO: Remove once legacy dataAPI is no longer used.
		invalidateCacheGroup( TYPE_MODULES, 'optimize' );

		return {};
	} ),
};

export const reducer = ( state, { type } ) => {
	switch ( type ) {
		case START_SUBMIT_CHANGES: {
			return {
				...state,
				isDoingSubmitChanges: true,
			};
		}

		case FINISH_SUBMIT_CHANGES: {
			return {
				...state,
				isDoingSubmitChanges: false,
			};
		}

		default: return state;
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Checks whether changes are currently being submitted.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if submitting, `false` if not.
	 */
	isDoingSubmitChanges( state ) {
		return !! state.isDoingSubmitChanges;
	},
};

const {
	safeSelector: canSubmitChanges,
	dangerousSelector: __dangerousCanSubmitChanges,
} = createValidationSelector( ( select ) => {
	const strictSelect = createStrictSelect( select );
	const {
		getOptimizeID,
		getAMPExperimentJSON,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( STORE_NAME );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );

	const ampExperimentJSON = getAMPExperimentJSON();
	invariant( isValidAMPExperimentJSON( ampExperimentJSON ), INVARIANT_INVALID_AMP_EXPERIMENT_JSON );

	const optimizeID = getOptimizeID();
	invariant( '' === optimizeID || isValidOptimizeID( optimizeID ), INVARIANT_INVALID_OPTIMIZE_ID );
} );

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors: {
		...selectors,
		canSubmitChanges,
		__dangerousCanSubmitChanges,
	},
};
