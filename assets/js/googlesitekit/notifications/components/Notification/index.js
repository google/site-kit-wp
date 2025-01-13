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
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ViewedStateObserver from './ViewedStateObserver';
import { useHasBeenViewed } from '../../hooks/useHasBeenViewed';
import useNotificationEvents from '../../hooks/useNotificationEvents';

export default function Notification( {
	id,
	className,
	gaTrackingEventArgs,
	children,
	onView,
} ) {
	const ref = useRef();
	const viewed = useHasBeenViewed( id );
	const trackEvents = useNotificationEvents(
		id,
		gaTrackingEventArgs?.category
	);

	const [ isViewedOnce, setIsViewedOnce ] = useState( false );

	// Track view once.
	useEffect( () => {
		if ( ! isViewedOnce && viewed ) {
			trackEvents.view(
				gaTrackingEventArgs?.label,
				gaTrackingEventArgs?.value
			);

			onView?.();

			setIsViewedOnce( true );
		}
	}, [ viewed, trackEvents, isViewedOnce, gaTrackingEventArgs, onView ] );

	return (
		<section id={ id } ref={ ref } className={ className }>
			{ children }

			{ /* Encapsulate observer to dispose when no longer needed. */ }
			{ ! viewed && (
				<ViewedStateObserver
					id={ id }
					observeRef={ ref }
					threshold={ 0.5 }
				/>
			) }
		</section>
	);
}

Notification.propTypes = {
	id: PropTypes.string,
	className: PropTypes.string,
	gaTrackingEventArgs: PropTypes.shape( {
		label: PropTypes.string,
		value: PropTypes.string,
	} ),
	children: PropTypes.node,
	onView: PropTypes.func,
};
