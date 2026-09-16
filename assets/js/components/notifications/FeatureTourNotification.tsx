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
import { useEffect, useState } from '@wordpress/element';

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
 * How long to wait for a tour's first target before giving the queue slot up
 * (30 seconds). Matches the ceiling the Site Goals tour waits under, so the two
 * tours give up on the same schedule.
 */
export const TARGET_WAIT_TIMEOUT_MS = 30000;

/**
 * Creates a notification component that runs the given feature tour.
 *
 * @since 1.187.0
 *
 * @param {Object} tour Feature tour definition.
 * @return {Function} Notification component for the tour.
 */
export default function createFeatureTourNotification(
	tour: FeatureTour
): FC< FeatureTourNotificationProps > {
	// Read defensively: this runs while the notifications module registers, so
	// a tour without steps would otherwise take that whole module down.
	const firstStepTarget = ( tour.steps?.[ 0 ] as { target?: string } )
		?.target;

	const FeatureTourNotification: FC< FeatureTourNotificationProps > = ( {
		id,
	} ) => {
		const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

		const isTourDismissed = useSelect(
			( select: Select ) =>
				select( CORE_USER ).isTourDismissed( tour.slug ),
			[]
		);

		const [ hasTarget, setHasTarget ] = useState(
			() =>
				! firstStepTarget ||
				!! global.document.querySelector( firstStepTarget )
		);

		// `TourTooltips` resolves its target when it mounts, so mounting it
		// before the widget that owns the target has rendered leaves the tour
		// invisible for the rest of the page load. Wait for the target instead,
		// and hand the queue slot back if it never arrives, so the tour cannot
		// hold the slot against a notification that would show something.
		useEffect( () => {
			if ( hasTarget || ! firstStepTarget ) {
				return () => {};
			}

			// Re-check before observing: when the target is committed in the
			// same render as this notification, it is already on the page by the
			// time effects run, and no further mutation would ever arrive.
			if ( global.document.querySelector( firstStepTarget ) ) {
				setHasTarget( true );
				return () => {};
			}

			const observer = new global.MutationObserver( () => {
				if ( global.document.querySelector( firstStepTarget ) ) {
					setHasTarget( true );
				}
			} );

			observer.observe( global.document.body, {
				childList: true,
				subtree: true,
			} );

			const timeoutID = global.setTimeout( () => {
				observer.disconnect();
				dismissNotification( id );
			}, TARGET_WAIT_TIMEOUT_MS );

			return () => {
				observer.disconnect();
				global.clearTimeout( timeoutID );
			};
		}, [ hasTarget, dismissNotification, id ] );

		// `TourTooltips` persists the dismissal itself, so this only hands the
		// queue slot back to whatever notification comes next.
		useEffect( () => {
			if ( isTourDismissed ) {
				dismissNotification( id );
			}
		}, [ isTourDismissed, dismissNotification, id ] );

		if ( ! hasTarget ) {
			return null;
		}

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
