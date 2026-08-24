/**
 * FeatureTourNotification component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import TourTooltips from '@/js/components/TourTooltips';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

export interface FeatureTour {
	slug: string;
	steps: object[];
	gaEventCategory: string | ( ( viewContext: string ) => string );
}

interface FeatureTourNotificationProps {
	id: string;
}

/**
 * Creates a notification component that runs the given feature tour.
 *
 * @since n.e.x.t
 *
 * @param {Object} tour Feature tour definition.
 * @return {Function} Notification component for the tour.
 */
export default function createFeatureTourNotification(
	tour: FeatureTour
): FC< FeatureTourNotificationProps > {
	const FeatureTourNotification: FC< FeatureTourNotificationProps > = ( {
		id,
	} ) => {
		const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

		const isTourDismissed = useSelect(
			( select: Select ) =>
				select( CORE_USER ).isTourDismissed( tour.slug ),
			[]
		);

		// `TourTooltips` persists the dismissal itself, so this only hands the
		// queue slot back to whatever notification comes next.
		useEffect( () => {
			if ( isTourDismissed ) {
				dismissNotification( id );
			}
		}, [ isTourDismissed, dismissNotification, id ] );

		return (
			<TourTooltips
				tourID={ tour.slug }
				steps={ tour.steps }
				gaEventCategory={ tour.gaEventCategory }
			/>
		);
	};

	return FeatureTourNotification;
}
