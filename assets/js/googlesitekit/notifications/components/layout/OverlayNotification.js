/**
 * OverlayNotification layout component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import OverlayCard from '../../../../components/OverlayCard';

export default function OverlayNotification( {
	notificationID,
	ctaButton,
	dismissButton,
	gaTrackingEventArgs,
	...props
} ) {
	const trackEvents = useNotificationEvents(
		notificationID,
		gaTrackingEventArgs?.category
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleDismissWithTrackEvent = async ( event ) => {
		await dismissButton?.onClick?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...dismissButton.dismissOptions,
		} );
	};

	const handleCTAClickWithTrackEvent = async ( event ) => {
		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		await ctaButton?.onClick?.( event );
	};

	return (
		<OverlayCard
			ctaButton={ {
				...ctaButton,
				onClick: handleCTAClickWithTrackEvent,
			} }
			dismissButton={ {
				...dismissButton,
				onClick: handleDismissWithTrackEvent,
			} }
			{ ...props }
			visible
		/>
	);
}

OverlayNotification.propTypes = {
	notificationID: PropTypes.string,
	ctaButton: PropTypes.object,
	dismissButton: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
};
