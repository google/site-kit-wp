/**
 * OverlayNotification component.
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
import { Slide } from '@material-ui/core';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { BREAKPOINTS_MOBILE, useBreakpoint } from '../../hooks/useBreakpoint';

const { useDispatch, useSelect } = Data;

export default function OverlayNotification( {
	children,
	GraphicDesktop,
	GraphicMobile,
	notificationID,
	onShow,
	shouldShowNotification,
} ) {
	const breakpoint = useBreakpoint();

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( notificationID )
	);

	const isShowingNotification = useSelect( ( select ) =>
		select( CORE_UI ).isShowingOverlayNotification( notificationID )
	);

	const { setOverlayNotificationToShow } = useDispatch( CORE_UI );

	useEffect( () => {
		if ( shouldShowNotification && ! isShowingNotification ) {
			// If the conditions to show this notification are met AND no other
			// notifications are showing, show this notification.
			setOverlayNotificationToShow( notificationID );

			onShow?.();
		}
	}, [
		isShowingNotification,
		notificationID,
		onShow,
		setOverlayNotificationToShow,
		shouldShowNotification,
	] );

	if ( isDismissed || ! shouldShowNotification || ! isShowingNotification ) {
		return null;
	}

	if ( BREAKPOINTS_MOBILE.includes( breakpoint ) ) {
		return (
			<div className="googlesitekit-overlay-notification">
				{ children }

				{ GraphicMobile && <GraphicMobile /> }
			</div>
		);
	}

	return (
		<Slide direction="up" in={ isShowingNotification }>
			<div className="googlesitekit-overlay-notification">
				{ GraphicDesktop && <GraphicDesktop /> }

				{ children }
			</div>
		</Slide>
	);
}

OverlayNotification.propTypes = {
	children: PropTypes.node,
	GraphicDesktop: PropTypes.elementType,
	GraphicMobile: PropTypes.elementType,
	onShow: PropTypes.func,
	notificationID: PropTypes.string.isRequired,
	shouldShowNotification: PropTypes.bool,
};
