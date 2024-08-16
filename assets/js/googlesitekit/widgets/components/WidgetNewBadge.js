/**
 * WidgetNewBadge component.
 *
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../datastore/user/constants';
import NewBadge from '../../../components/NewBadge';
import { WEEK_IN_SECONDS } from '../../../util';
import { CORE_WIDGETS } from '../datastore/constants';

export default function WidgetNewBadge( { slug } ) {
	const widgetArea = useSelect( ( select ) =>
		select( CORE_WIDGETS ).getWidgetArea( slug )
	);

	const { hasNewBadge } = widgetArea;

	// WidgetNewBadge Expirable Item
	const expirableBadgeSlug = `widget-area-expirable-new-badge-${ slug }`;

	const hasBadgeBeenSeen = useSelect( ( select ) =>
		select( CORE_USER ).hasExpirableItem( expirableBadgeSlug )
	);

	const isExpiredBadgeActive = useSelect( ( select ) =>
		select( CORE_USER ).isExpirableItemActive( expirableBadgeSlug )
	);

	// Show the new badge if this widget area allows new badges, it's new badge
	// has not been seen yet, or the badge has been seen and is still active.
	const showNewBadge =
		hasNewBadge && ( hasBadgeBeenSeen === false || isExpiredBadgeActive );

	const { setExpirableItemTimers } = useDispatch( CORE_USER );

	useEffect( () => {
		// Wait until the selectors have resolved.
		if (
			hasBadgeBeenSeen !== undefined &&
			isExpiredBadgeActive !== undefined
		) {
			// Only set the expirable item if the badge is new and the user is viewing it for the first time.
			if ( hasNewBadge && ! hasBadgeBeenSeen ) {
				setExpirableItemTimers( [
					{
						slug: expirableBadgeSlug,
						expiresInSeconds: WEEK_IN_SECONDS * 4,
					},
				] );
			}
		}
	}, [
		hasNewBadge,
		expirableBadgeSlug,
		hasBadgeBeenSeen,
		isExpiredBadgeActive,
		setExpirableItemTimers,
	] );

	if ( ! showNewBadge ) {
		return false;
	}

	return <NewBadge />;
}

WidgetNewBadge.propTypes = {
	slug: PropTypes.string.isRequired,
};
