/**
 * Change metrics feature tour hook.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import sharedKeyMetrics from '@/js/feature-tours/shared-key-metrics';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { isInitialWelcomeModalActive } from '@/js/util/welcome-modal';

/**
 * Dismisses the shared key metrics tour while the initial welcome modal is up.
 *
 * The tour itself is queued as a notification; this only keeps it from waiting
 * behind the welcome modal for a user who will never need it.
 *
 * @since 1.113.0
 * @since n.e.x.t Removed the on-demand tour trigger, which the notification queue now owns.
 */
export function useChangeMetricsFeatureTourEffect() {
	const { dismissTour } = useDispatch( CORE_USER );

	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const isTourDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isTourDismissed( sharedKeyMetrics.slug )
	);

	useEffect( () => {
		if ( ! setupFlowRefreshEnabled || ! isInitialWelcomeModalActive() ) {
			return;
		}

		if ( isTourDismissed === false ) {
			dismissTour( sharedKeyMetrics.slug );
		}
	}, [ dismissTour, isTourDismissed, setupFlowRefreshEnabled ] );
}
