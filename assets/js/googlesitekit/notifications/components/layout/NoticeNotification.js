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
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { Grid, Cell, Row } from '@/js/material-components';
import propTypes from 'prop-types';

export default function NoticeNotification( {
	notificationID,
	children,
	dismissButton,
	ctaButton,
	gaTrackingEventArgs,
	...props
} ) {
	const trackEvents = useNotificationEvents( notificationID );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	async function handleDismissWithTrackEvent( event ) {
		await dismissButton?.onClick?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...( dismissButton?.dismissOptions || {} ),
		} );
	}

	async function handleCTAClickWithTrackEvent( event ) {
		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);

		await ctaButton?.onClick?.( event );

		if ( ctaButton?.dismissOnClick ) {
			dismissNotification( notificationID, {
				...ctaButton?.dismissOptions,
			} );
		}
	}

	return (
		<Grid>
			<Row>
				<Cell size={ 12 } alignMiddle>
					<Notice
						dismissButton={ {
							...dismissButton,
							onClick: handleDismissWithTrackEvent,
						} }
						ctaButton={ {
							...ctaButton,
							onClick: handleCTAClickWithTrackEvent,
						} }
						{ ...props }
					>
						{ children }
					</Notice>
				</Cell>
			</Row>
		</Grid>
	);
}

NoticeNotification.propTypes = {
	notificationID: propTypes.string.isRequired,
	children: propTypes.node,
	dismissButton: propTypes.oneOfType( [ propTypes.bool, propTypes.object ] ),
	ctaButton: propTypes.object,
	gaTrackingEventArgs: propTypes.object,
};
