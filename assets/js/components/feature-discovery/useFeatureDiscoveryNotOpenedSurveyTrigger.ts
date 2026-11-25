/**
 * Feature Discovery "not opened" survey trigger hook.
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
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import {
	CORE_USER,
	SURVEY_TRIGGER_MAX_TTL,
} from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import {
	FDH_NOT_OPENED_SURVEY_TRIGGER_ID,
	FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
} from './constants';

/**
 * Sends the `fdh_not_opened` survey trigger from the main dashboard.
 *
 * The trigger is sent once all the following are true: the user is
 * authenticated, they have never opened the Feature Discovery Hub, at least
 * one feature is unread, and at least two features are not set up yet. It is
 * sent at most once per user. Nothing is sent while any value is loading.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export default function useFeatureDiscoveryNotOpenedSurveyTrigger(): void {
	const isFeatureDiscoveryHubEnabled = useFeature( 'featureDiscoveryHub' );

	const { triggerSurvey } = useDispatch( CORE_USER );

	const shouldTrigger: boolean = useSelect(
		( select: Select ) => {
			if ( ! isFeatureDiscoveryHubEnabled ) {
				return false;
			}

			const isAuthenticated = select( CORE_USER ).isAuthenticated();
			const hasVisitedHub = select( CORE_USER ).isItemDismissed(
				FEATURE_DISCOVERY_VISITED_ITEM_SLUG
			);

			if ( ! isAuthenticated || hasVisitedHub !== false ) {
				return false;
			}

			const newFeatureCount = select(
				CORE_FEATURE_DISCOVERY
			).getNewFeatureCount();

			if ( newFeatureCount === undefined || newFeatureCount < 1 ) {
				return false;
			}

			const availableFeatures = select(
				CORE_FEATURE_DISCOVERY
			).getAvailableFeatures();

			return availableFeatures?.length >= 2;
		},
		[ isFeatureDiscoveryHubEnabled ]
	);

	useEffect( () => {
		if ( shouldTrigger ) {
			triggerSurvey( FDH_NOT_OPENED_SURVEY_TRIGGER_ID, {
				ttl: SURVEY_TRIGGER_MAX_TTL,
			} );
		}
	}, [ shouldTrigger, triggerSurvey ] );
}
