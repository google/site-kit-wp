/**
 * `modules/analytics-4` data store: accounts.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	ENHANCED_MEASUREMENT_ENABLED,
	FORM_ACCOUNT_CREATE,
	MODULES_ANALYTICS_4,
} from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { isValidAccountSelection } from '../utils/validation';
import { caseInsensitiveListSort } from '../../../util/case-insensitive-sort';
import {
	populateAccountID,
	populatePropertyAndAccountIds,
} from '../utils/account';

const { receiveError, clearError, clearErrors } = errorStoreActions;

const fetchGetAccountSummariesStore = createFetchStore( {
	baseName: 'getAccountSummaries',
	controlCallback( { pageToken } ) {
		return API.get(
			'modules',
			'analytics-4',
			'account-summaries',
			{ pageToken },
			{
				useCache: false,
			}
		);
	},
	argsToParams: ( pageToken ) => {
		return { pageToken };
	},
	reducerCallback( state, response ) {
		const { accountSummaries: newAccountSummaries } = response;
		const mergedAccountSummaries = [
			...( state.accountSummaries || [] ),
			...newAccountSummaries,
		];

		return {
			...state,
			accountSummaries: mergedAccountSummaries,
		};
	},
} );

const fetchCreateAccountStore = createFetchStore( {
	baseName: 'createAccount',
	controlCallback: ( { data } ) => {
		return API.set(
			'modules',
			'analytics-4',
			'create-account-ticket',
			data
		);
	},
	// eslint-disable-next-line sitekit/acronym-case
	reducerCallback: ( state, { accountTicketId: accountTicketID } ) => {
		return {
			...state,
			accountTicketID,
		};
	},
	argsToParams: ( data ) => {
		return { data };
	},
	validateParams: ( { data } = {} ) => {
		invariant( isPlainObject( data ), 'data must be an object.' );
	},
} );

// Actions.
const START_SELECTING_ACCOUNT = 'START_SELECTING_ACCOUNT';
const FINISH_SELECTING_ACCOUNT = 'FINISH_SELECTING_ACCOUNT';
const RESET_ACCOUNT_SUMMARIES = 'RESET_ACCOUNT_SUMMARIES';
const RESET_ACCOUNT_SETTINGS = 'RESET_ACCOUNT_SETTINGS';
const TRANSFORM_AND_SORT_ACCOUNT_SUMMARIES =
	'TRANSFORM_AND_SORT_ACCOUNT_SUMMARIES';

const baseInitialState = {
	accountSummaries: undefined,
	accountTicketID: undefined,
	finishedSelectingAccount: undefined,
};

const baseActions = {
	/**
	 * Resets the account summaries.
	 *
	 * @since 1.118.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetAccountSummaries() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNT_SUMMARIES,
		};

		return dispatch(
			MODULES_ANALYTICS_4
		).invalidateResolutionForStoreSelector( 'getAccountSummaries' );
	},

	/**
	 * Resets the account settings.
	 *
	 * @since 1.138.0
	 *
	 * @return {Object} Redux-style action.
	 */
	resetAccountSettings() {
		return {
			payload: {},
			type: RESET_ACCOUNT_SETTINGS,
		};
	},

	/**
	 * Creates a new Analytics (GA4) account.
	 *
	 * @since 1.98.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*createAccount() {
		const registry = yield commonActions.getRegistry();

		const { getValue } = registry.select( CORE_FORMS );
		const data = {
			displayName: getValue( FORM_ACCOUNT_CREATE, 'accountName' ),
			propertyName: getValue( FORM_ACCOUNT_CREATE, 'propertyName' ),
			dataStreamName: getValue( FORM_ACCOUNT_CREATE, 'dataStreamName' ),
			timezone: getValue( FORM_ACCOUNT_CREATE, 'timezone' ),
			regionCode: getValue( FORM_ACCOUNT_CREATE, 'countryCode' ),
			enhancedMeasurementStreamEnabled: getValue(
				FORM_ACCOUNT_CREATE,
				ENHANCED_MEASUREMENT_ENABLED
			),
		};

		yield clearError( 'createAccount', [] );
		const { response, error } =
			yield fetchCreateAccountStore.actions.fetchCreateAccount( data );

		if ( error ) {
			yield receiveError( error, 'createAccount', [] );
		}

		return { response, error };
	},

	/**
	 * Sets the given account in the store.
	 *
	 * @since 1.119.0
	 *
	 * @param {string} accountID Analytics account ID.
	 * @return {Object} A generator function.
	 */
	selectAccount: createValidatedAction(
		( accountID ) => {
			invariant(
				isValidAccountSelection( accountID ),
				'A valid accountID is required to select.'
			);
		},
		function* ( accountID ) {
			const registry = yield commonActions.getRegistry();
			const finishSelectingAccountAction = {
				type: FINISH_SELECTING_ACCOUNT,
				payload: {},
			};

			yield {
				type: START_SELECTING_ACCOUNT,
				payload: {},
			};

			yield clearErrors();

			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				accountID,
				propertyID: '',
				webDataStreamID: '',
			} );

			if ( ACCOUNT_CREATE === accountID ) {
				yield finishSelectingAccountAction;
				return;
			}

			yield commonActions.await(
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID, PROPERTY_CREATE )
			);

			yield finishSelectingAccountAction;
		}
	),

	/**
	 * Finds a matching account summary.
	 *
	 * @since 1.118.0
	 *
	 * @return {Object|null} Matching account summary on success, otherwise NULL.
	 */
	*findMatchedAccount() {
		const registry = yield commonActions.getRegistry();
		const matchedProperty = yield commonActions.await(
			registry.dispatch( MODULES_ANALYTICS_4 ).findMatchedProperty()
		);

		if ( ! matchedProperty ) {
			return null;
		}

		const accountSummaries = yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getAccountSummaries()
		);

		const matchedAccount = accountSummaries.find( ( account ) =>
			account.propertySummaries.some(
				( { _id } ) => _id === matchedProperty._id
			)
		);

		return matchedAccount || null;
	},

	/**
	 * Creates an action to transform and sort account summaries.
	 *
	 * This action is typically dispatched when account summaries need to be
	 * transformed (e.g., extracting and populating relevant account and property
	 * IDs) and then sorted in a case-insensitive manner by display name.
	 *
	 * @since 1.138.0
	 *
	 * @return {Object} The action object with the type `TRANSFORM_AND_SORT_ACCOUNT_SUMMARIES`.
	 */
	transformAndSortAccountSummaries() {
		return {
			type: TRANSFORM_AND_SORT_ACCOUNT_SUMMARIES,
		};
	},
};

const baseControls = {};

/**
 * Creates immer reducer.
 */
const baseReducer = createReducer( ( state, { type } ) => {
	switch ( type ) {
		case START_SELECTING_ACCOUNT:
			state.finishedSelectingAccount = false;
			break;

		case FINISH_SELECTING_ACCOUNT:
			state.finishedSelectingAccount = true;
			break;

		case RESET_ACCOUNT_SUMMARIES:
			state.accountSummaries = undefined;
			break;

		case RESET_ACCOUNT_SETTINGS:
			state.settings.accountID = undefined;
			state.settings.propertyID = undefined;
			state.settings.measurementID = undefined;
			state.settings.webDataStreamID = undefined;
			break;

		case TRANSFORM_AND_SORT_ACCOUNT_SUMMARIES:
			if ( ! state.accountSummaries?.length ) {
				return state;
			}

			state.accountSummaries = state.accountSummaries.map(
				( account ) => {
					const accountObj = populateAccountID( account );
					accountObj.propertySummaries = (
						accountObj.propertySummaries || []
					).map( ( property ) =>
						populatePropertyAndAccountIds( property )
					);

					return accountObj;
				}
			);

			state.accountSummaries = caseInsensitiveListSort(
				state.accountSummaries,
				'displayName'
			);

			return state;
	}
} );

const baseResolvers = {
	*getAccountSummaries() {
		const registry = yield commonActions.getRegistry();
		let nextPageToken = '';
		const summaries = registry
			.select( MODULES_ANALYTICS_4 )
			.getAccountSummaries();

		// Fetch initial account summaries if they are undefined.
		if ( summaries === undefined ) {
			do {
				const { error, response } =
					yield fetchGetAccountSummariesStore.actions.fetchGetAccountSummaries(
						nextPageToken
					);
				nextPageToken = response?.nextPageToken || '';

				if ( error ) {
					break;
				}
			} while ( nextPageToken );
		}

		yield baseActions.transformAndSortAccountSummaries();
	},
};

const baseSelectors = {
	/**
	 * Gets account summaries.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array.<Object>} Account summaries array.
	 */
	getAccountSummaries( state ) {
		return state.accountSummaries;
	},

	/**
	 * Indicates whether account creation is currently in progress.
	 *
	 * @since 1.98.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if an account is being created, false otherwise.
	 */
	isDoingCreateAccount( state ) {
		// Since isFetchingCreateAccount (via createFetchStore)
		// holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such
		// request is in progress.
		return Object.values( state.isFetchingCreateAccount ).some( Boolean );
	},

	/**
	 * Get the terms of service URL.
	 *
	 * @since 1.98.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The terms of service URL.
	 */
	getAccountTicketTermsOfServiceURL: createRegistrySelector(
		( select ) => ( state ) => {
			const { accountTicketID } = state;

			if ( accountTicketID === undefined ) {
				return undefined;
			}

			const termsOfServiceURL = select(
				MODULES_ANALYTICS_4
			).getServiceURL( {
				path: `/termsofservice/${ accountTicketID }`,
				query: { provisioningSignup: 'false' },
			} );

			if ( ! termsOfServiceURL ) {
				return undefined;
			}

			return termsOfServiceURL;
		}
	),

	/**
	 * Whether or not the account create form is valid to submit.
	 *
	 * @since 1.98.0
	 * @private
	 *
	 * @return {boolean} True if valid, otherwise false.
	 */
	canSubmitAccountCreate: createRegistrySelector( ( select ) => () => {
		const { getValue } = select( CORE_FORMS );

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'accountName' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'propertyName' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'dataStreamName' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'timezone' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'countryCode' ) ) {
			return false;
		}

		return true;
	} ),

	/**
	 * Determines whether the account selection process has finished or not.
	 *
	 * @since 1.119.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} Initially undefined, TRUE if the account selection process has finished, otherwise FALSE.
	 */
	hasFinishedSelectingAccount( state ) {
		return state.finishedSelectingAccount;
	},
};

const store = combineStores(
	fetchGetAccountSummariesStore,
	fetchCreateAccountStore,
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
