/**
 * `modules/ads` data store: intents.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Registry, commonActions, createReducer } from 'googlesitekit-data';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_INTENTS } from '@/js/googlesitekit/datastore/intents/constants';
import { CompleteIntentResult } from '@/js/googlesitekit/datastore/intents/intents';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	ADS_CONVERSION_TRACKING_INTENT_SLUG,
	MODULE_SLUG_ADS,
} from '@/js/modules/ads/constants';
import { isValidConversionID } from '@/js/modules/ads/utils/validation';
import { ErrorObject } from '@/js/util/errors';
import { MODULES_ADS } from './constants';

interface ActionResult {
	/** Error from the request, or `undefined` when the request succeeds. */
	error?: ErrorObject;
}

interface CompleteConversionTrackingIntentResult {
	/** URL to send the user back to Google Ads with the setup outcome and the conversion events the site tracks, or `undefined` when a step fails. */
	returnURL?: string;
	/** Error from the step that failed, or `undefined` when every step succeeds. */
	error?: ErrorObject;
}

interface IntentsState {
	/** Whether the user confirmed the tag on the Ads conversion tracking intent screen. */
	isConversionTrackingIntentTagConfirmed: boolean;
}

const CONFIRM_CONVERSION_TRACKING_INTENT_TAG =
	'CONFIRM_CONVERSION_TRACKING_INTENT_TAG' as const;

type Action = {
	type: typeof CONFIRM_CONVERSION_TRACKING_INTENT_TAG;
	payload: Record< string, never >;
};

const initialState: IntentsState = {
	isConversionTrackingIntentTagConfirmed: false,
};

const actions = {
	/**
	 * Places the Google tag of an Ads conversion tracking intent, then completes the intent.
	 *
	 * Activates the Ads module if it isn't active yet, saves the tag as the
	 * conversion ID, enables conversion tracking, and completes the intent on
	 * the Site Kit Service. Stops at the first step that fails.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} intentCode Code the Site Kit Service created for the intent.
	 * @param {string} tagID      Google tag ID to save as the conversion ID, e.g. `AW-123456789`.
	 * @return {Object} Object with `returnURL`, the URL to send the user back to Google Ads with the setup outcome and the conversion events the site tracks, or with `error` when a step fails.
	 */
	completeConversionTrackingIntent: createValidatedAction(
		( intentCode: string, tagID: string ) => {
			invariant( intentCode, 'intentCode is required.' );
			invariant(
				isValidConversionID( tagID ),
				'a valid tagID is required.'
			);
		},
		function* (
			intentCode: string,
			tagID: string
		): Generator<
			unknown,
			CompleteConversionTrackingIntentResult,
			unknown
		> {
			const { dispatch, resolveSelect, select } =
				( yield commonActions.getRegistry() ) as Registry;

			const isAdsModuleActive = yield commonActions.await(
				resolveSelect( CORE_MODULES ).isModuleActive( MODULE_SLUG_ADS )
			);

			// Other callers send the user to `moduleReauthURL` to set up the
			// module after activating it. Saving the tag below is all the
			// setup this flow needs.
			if ( ! isAdsModuleActive ) {
				const { error } = ( yield commonActions.await(
					dispatch( CORE_MODULES ).activateModule( MODULE_SLUG_ADS )
				) ) as ActionResult;

				if ( error ) {
					return { error };
				}
			}

			// Load the conversion tracking settings before changing one: saving
			// replaces all of them, and nothing is saved if tracking is already on.
			yield commonActions.await(
				resolveSelect( CORE_SITE ).getConversionTrackingSettings()
			);

			dispatch( MODULES_ADS ).setConversionID( tagID );
			// Site Kit only sends the events listed in `tracked_conversion_ids`
			// while conversion tracking is on. `submitChanges()` saves this too.
			dispatch( CORE_SITE ).setConversionTrackingEnabled( true );

			const { error: saveError } = ( yield commonActions.await(
				dispatch( MODULES_ADS ).submitChanges()
			) ) as ActionResult;

			if ( saveError ) {
				return { error: saveError };
			}

			const { response, error: completeError } =
				( yield commonActions.await(
					dispatch( CORE_INTENTS ).completeIntent(
						ADS_CONVERSION_TRACKING_INTENT_SLUG,
						intentCode
					)
				) ) as CompleteIntentResult;

			if ( completeError ) {
				return { error: completeError };
			}

			yield commonActions.await(
				resolveSelect( MODULES_ADS ).getModuleData()
			);

			// Google Ads pre-selects the conversion actions for these events.
			// A site that tracks none still sends the parameter, empty.
			const trackedConversionEvents: string[] =
				select( MODULES_ADS ).getSupportedConversionEvents() || [];

			return {
				returnURL: addQueryArgs( response?.return_url, {
					// The redirect alone doesn't tell Google Ads the tag was placed.
					sitekit_status: 'success',
					tracked_conversion_ids: trackedConversionEvents.join( ',' ),
				} ),
			};
		}
	),

	/**
	 * Confirms the tag on the Ads conversion tracking intent screen.
	 *
	 * Confirming only unlocks placing the tag: nothing is saved until
	 * `completeConversionTrackingIntent()` places it.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	confirmConversionTrackingIntentTag() {
		return {
			payload: {},
			type: CONFIRM_CONVERSION_TRACKING_INTENT_TAG,
		};
	},
};

const reducer = createReducer( ( state: IntentsState, action: Action ) => {
	switch ( action.type ) {
		case CONFIRM_CONVERSION_TRACKING_INTENT_TAG:
			state.isConversionTrackingIntentTagConfirmed = true;
			break;

		default:
			break;
	}
} );

const selectors = {
	/**
	 * Checks whether the user confirmed the tag on the Ads conversion tracking intent screen.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if the user confirmed the tag, otherwise `false`.
	 */
	isConversionTrackingIntentTagConfirmed( state: IntentsState ): boolean {
		return state.isConversionTrackingIntentTagConfirmed;
	},
};

const store = {
	initialState,
	actions,
	reducer,
	selectors,
};

export default store;
