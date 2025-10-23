/**
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
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Requires that data is available on load.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether data is available on load or not.
 */
export function requireDataIsAvailableOnLoad() {
	return ( { select } ) =>
		true === select( MODULES_ANALYTICS_4 ).isDataAvailableOnLoad();
}

/**
 * Requires that audience segmentation setup is completed.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether setup is completed or not.
 */
export function requireAudienceSegmentationSetupCompleted() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ANALYTICS_4 ).getAudienceSettings();

		return !! select(
			MODULES_ANALYTICS_4
		).getAudienceSegmentationSetupCompletedBy();
	};
}

/**
 * Requires that audience segmentation setup was completed by the current user.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether setup was completed by the current user or not.
 */
export function requireAudienceSegmentationSetupCompletedByUser() {
	return async ( { select, resolveSelect } ) => {
		await Promise.all( [
			// The getAudienceSegmentationSetupCompletedBy() selector relies
			// on the resolution of the getAudienceSettings() resolver.
			resolveSelect( MODULES_ANALYTICS_4 ).getAudienceSettings(),
			// The getID() selector relies on the resolution
			// of the getUser() resolver.
			resolveSelect( CORE_USER ).getUser(),
		] );

		const userID = select( CORE_USER ).getID();
		const setupCompletedBy =
			select(
				MODULES_ANALYTICS_4
			).getAudienceSegmentationSetupCompletedBy();

		return setupCompletedBy === userID;
	};
}

/**
 * Requires that the connected web datastream is not available.
 *
 * @since n.e.x.t
 *
 * @return {boolean} `true` if the connected web datastream is not available, otherwise `false`.
 */
export function requireWebDataStreamUnavailable() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ANALYTICS_4 ).getModuleData();

		return (
			true === select( MODULES_ANALYTICS_4 ).isWebDataStreamUnavailable()
		);
	};
}

/**
 * Requires that the connected Google tag ID is mismatched.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether the connected Google tag is mismatched or not.
 */
export function requireMismatchedGoogleTag() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ANALYTICS_4 ).getModuleData();

		return select( MODULES_ANALYTICS_4 ).hasMismatchedGoogleTagID();
	};
}

/**
 * Requires that enhanced measurement is enabled for the connected web datastream.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether enhanced measurement is enabled or not.
 */
export function requireEnhancedMeasurementEnabled() {
	return async ( { select, resolveSelect } ) => {
		const { isEnhancedMeasurementStreamEnabled, getSettings } =
			resolveSelect( MODULES_ANALYTICS_4 );

		await getSettings();
		const { getPropertyID, getWebDataStreamID } =
			select( MODULES_ANALYTICS_4 );

		return (
			true ===
			( await isEnhancedMeasurementStreamEnabled(
				getPropertyID(),
				getWebDataStreamID()
			) )
		);
	};
}
