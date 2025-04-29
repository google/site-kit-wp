/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { COUNT_VIEW_TIMEOUT } from '../../constants';
import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../../../datastore/ui/constants';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import useLatestIntersection from '../../../../hooks/useLatestIntersection';
import { useHasBeenViewed } from '../../hooks/useHasBeenViewed';

export default function ViewedStateObserver( { id, observeRef, threshold } ) {
	const intersectionEntry = useLatestIntersection( observeRef, {
		threshold,
	} );

	const { setValue } = useDispatch( CORE_UI );
	const { markNotificationSeen } = useDispatch( CORE_NOTIFICATIONS );
	const isInView = !! intersectionEntry?.isIntersecting;
	const viewed = useHasBeenViewed( id );
	const timeoutRef = useRef();

	useEffect( () => {
		// If notification is not viewed yet and is in view, start the timer
		if ( ! viewed && isInView ) {
			// Clear any existing timeout.
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
			}

			// Set a new timeout for 3 seconds.
			timeoutRef.current = setTimeout( () => {
				// Only mark as viewed if still in view after 3 seconds.
				if ( intersectionEntry?.isIntersecting ) {
					setValue( useHasBeenViewed.getKey( id ), true );
					markNotificationSeen( id );
				}
			}, COUNT_VIEW_TIMEOUT );
		} else if ( ! isInView && timeoutRef.current ) {
			// If notification is no longer in view, clear the timeout
			clearTimeout( timeoutRef.current );
		}

		// Cleanup function to clear timeout on unmount or when dependencies change.
		return () => {
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [
		viewed,
		isInView,
		setValue,
		markNotificationSeen,
		id,
		intersectionEntry,
	] );

	return null;
}

ViewedStateObserver.propTypes = {
	id: PropTypes.string,
	observeRef: PropTypes.object,
	threshold: PropTypes.number,
};
