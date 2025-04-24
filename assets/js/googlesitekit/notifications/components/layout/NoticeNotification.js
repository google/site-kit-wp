/**
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
import Notice from '../../../../components/Notice';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';

export default function NoticeNotification( {
	notificationID,
	type,
	children,
	dismissButton,
	ctaButton,
	...props
} ) {
	const trackEvents = useNotificationEvents( notificationID );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleDismissWithTrackEvent = async ( event ) => {
		await dismissButton?.onClick?.( event );
		trackEvents.dismiss();
		dismissNotification( notificationID, {
			...dismissButton.dismissOptions,
		} );
	};

	const handleCTAClickWithTrackEvent = async ( event ) => {
		await ctaButton?.onClick?.( event );
		await trackEvents.confirm();
		dismissNotification( notificationID, {
			...ctaButton.dismissOptions,
		} );
	};

	return (
		<Notice
			type={ type }
			dismissButton={ {
				label: dismissButton.label,
				onClick: handleDismissWithTrackEvent,
			} }
			ctaButton={ {
				label: ctaButton.label,
				onClick: handleCTAClickWithTrackEvent,
			} }
			{ ...props }
		>
			{ children }
		</Notice>
	);
}

NoticeNotification.propTypes = {
	notificationID: PropTypes.string.isRequired,
	type: PropTypes.oneOf( [ 'win-success', 'warning', 'error', 'info' ] ),
	dismissible: PropTypes.bool,
	dismissLabel: PropTypes.string,
	onDismiss: PropTypes.func,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	ctaCallback: PropTypes.func,
	children: PropTypes.node,
};
