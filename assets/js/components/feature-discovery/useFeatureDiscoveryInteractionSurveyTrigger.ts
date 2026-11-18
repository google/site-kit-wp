/**
 * Feature Discovery Hub interaction survey trigger hook.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { FEATURE_HUB_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import {
	CORE_USER,
	SURVEY_TRIGGER_MAX_TTL,
} from '@/js/googlesitekit/datastore/user/constants';

/**
 * Returns a callback that sends the Feature Discovery Hub interaction survey
 * trigger.
 *
 * The trigger is sent with the maximum TTL, so it is sent at most once per
 * user however often the callback is called. The callback does not wait for
 * the request, so a failed trigger never blocks the interaction.
 *
 * @since n.e.x.t
 *
 * @return {Function} Callback that sends the survey trigger.
 */
export default function useFeatureDiscoveryInteractionSurveyTrigger(): () => void {
	const { triggerSurvey } = useDispatch( CORE_USER );

	return useCallback( () => {
		triggerSurvey( FEATURE_HUB_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID, {
			ttl: SURVEY_TRIGGER_MAX_TTL,
		} );
	}, [ triggerSurvey ] );
}
