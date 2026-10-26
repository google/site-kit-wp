/**
 * `core/user` data store: feedback.
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
 * Internal dependencies
 */
import { set } from 'googlesitekit-api';
import { combineStores } from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { ErrorObject } from '@/js/util/errors';

export interface Feedback {
	/** The product area the feedback is about, e.g. `feature_hub`. */
	namespace: string;
	/** The item within the namespace the feedback is about, e.g. `feature_relevancy_analytics-4`. */
	group: string;
	/** The kind of feedback, e.g. `vote`. */
	key: string;
	/** The feedback value, e.g. `up`. */
	value: string;
}

export interface SendFeedbackResult {
	/** Response from the Site Kit Service, or `undefined` when the request fails. */
	response?: {
		success: true;
	};
	/** Error from the request, or `undefined` when the request succeeds. */
	error?: ErrorObject;
}

const REQUIRED_FEEDBACK_FIELDS = [
	'namespace',
	'group',
	'key',
	'value',
] as const;

/**
 * Throws an error when a required feedback field is missing or not a string.
 *
 * @since n.e.x.t
 *
 * @param {Object} feedback The feedback to validate.
 * @return {void}
 */
function validateFeedback( feedback: Partial< Feedback > ): void {
	REQUIRED_FEEDBACK_FIELDS.forEach( ( field ) => {
		invariant(
			typeof feedback?.[ field ] === 'string' && feedback[ field ],
			`${ field } is required and must be a string.`
		);
	} );
}

const fetchSendFeedbackStore = createFetchStore( {
	baseName: 'sendFeedback',
	controlCallback: ( feedback: Feedback ) =>
		set( 'core', 'user', 'feedback', feedback ),
	argsToParams: ( feedback: Feedback ) => feedback,
	validateParams: validateFeedback,
	isAction: true,
} ) as {
	actions: {
		fetchSendFeedback: ( feedback: Feedback ) => unknown;
	};
};

const baseActions = {
	/**
	 * Sends feedback to the Site Kit Service.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} feedback           The feedback to send.
	 * @param {string} feedback.namespace The product area the feedback is about.
	 * @param {string} feedback.group     The item within the namespace the feedback is about.
	 * @param {string} feedback.key       The kind of feedback.
	 * @param {string} feedback.value     The feedback value.
	 * @return {Object} Object with `response` and `error`.
	 */
	sendFeedback: createValidatedAction(
		( feedback: Feedback ) => validateFeedback( feedback ),
		function* (
			feedback: Feedback
		): Generator< unknown, SendFeedbackResult, unknown > {
			return ( yield fetchSendFeedbackStore.actions.fetchSendFeedback(
				feedback
			) ) as SendFeedbackResult;
		}
	),
};

const store = combineStores( fetchSendFeedbackStore, {
	actions: baseActions,
} );

export default store;
