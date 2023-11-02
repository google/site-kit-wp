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
 * External dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import sharedKeyMetrics from '../../../feature-tours/shared-key-metrics';
const { useSelect, useDispatch } = Data;

/**
 * Triggers on demand tour for shared key metrics if all conditions are met.
 *
 * @since 1.113.0
 *
 * @param {boolean} renderChangeMetricLink If metric link meets the conditions to render.
 */
export const useChangeMetricsFeatureTourEffect = ( renderChangeMetricLink ) => {
	const keyMetricsSetupCompletedBy = useSelect( ( select ) =>
		select( CORE_SITE ).getKeyMetricsSetupCompletedBy()
	);
	const currentUserID = useSelect( ( select ) =>
		select( CORE_USER ).getID()
	);
	const { triggerOnDemandTour } = useDispatch( CORE_USER );

	const isUserEligibleForTour =
		Number.isInteger( keyMetricsSetupCompletedBy ) &&
		Number.isInteger( currentUserID ) &&
		keyMetricsSetupCompletedBy > 0 &&
		currentUserID !== keyMetricsSetupCompletedBy;

	useEffect( () => {
		if ( renderChangeMetricLink && isUserEligibleForTour ) {
			triggerOnDemandTour( sharedKeyMetrics );
		}
	}, [ renderChangeMetricLink, isUserEligibleForTour, triggerOnDemandTour ] );
};
