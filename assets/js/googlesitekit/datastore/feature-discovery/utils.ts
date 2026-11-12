/**
 * `core/feature-discovery` data store utilities.
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
 * Internal dependencies
 */
import { VoteDirection } from '@/js/components/feedback/constants';

/**
 * Gets the feature dismissal key for a feature.
 *
 * @since 1.188.0
 *
 * @param {string} slug Feature slug.
 * @return {string} Feature dismissal key.
 */
export function getFeatureDismissalKey( slug: string ) {
	return `feature-discovery-dismissed-${ slug }`;
}

/**
 * Gets the incomplete setup reminder dismissal key for a feature.
 *
 * @since 1.191.0
 *
 * @param {string} slug Feature slug.
 * @return {string} Feature incomplete setup reminder dismissal key.
 */
export function getFeatureIncompleteSetupReminderKey( slug: string ) {
	return `feature-discovery-incomplete-setup-${ slug }`;
}

/**
 * Returns whether the provided key is a feature incomplete setup reminder key.
 *
 * @since n.e.x.t
 *
 * @param {string} key Key to check.
 * @return {boolean} Whether the provided key is a feature incomplete setup reminder key.
 */
export function isFeatureIncompleteSetupReminderKey( key: string ) {
	const prefix = getFeatureIncompleteSetupReminderKey( '' );

	return key.startsWith( prefix );
}

/**
 * Gets the feature newness key for a feature.
 *
 * @since 1.188.0
 *
 * @param {string} slug Feature slug.
 * @return {string} Feature newness key.
 */
export function getFeatureNewnessKey( slug: string ) {
	return `feature-discovery-new-${ slug }`;
}

/**
 * Gets the survey trigger ID for a feature setup.
 *
 * @since 1.189.0
 *
 * @param {string} slug Feature slug.
 * @return {string} Survey trigger ID.
 */
export function getFeatureSetupSurveyTriggerID( slug: string ) {
	return `setup:feature_setup_${ slug }`;
}

/**
 * Gets the feedback group for a feature's relevancy feedback.
 *
 * @since 1.189.0
 * @since 1.192.0 Renamed from `getFeatureRelevancyTriggerID()`, dropped the `reason` segment (now sent as the feedback `value`), and returns a feedback group instead of a survey trigger ID.
 *
 * @param {string} slug Feature slug.
 * @return {string} Feedback group.
 */
export function getFeatureRelevancyFeedbackGroup( slug: string ) {
	return `feature_relevancy_${ slug }`;
}

/**
 * Gets the dismissed item slug for a feature relevancy vote.
 *
 * @since 1.190.0
 *
 * @param {string}        slug      Feature slug.
 * @param {VoteDirection} direction Vote direction.
 * @return {string} Relevancy vote slug.
 */
export function getFeatureRelevancyVoteSlug(
	slug: string,
	direction: VoteDirection
) {
	return `feature-discovery-relevancy-${ slug }-${ direction }`;
}
