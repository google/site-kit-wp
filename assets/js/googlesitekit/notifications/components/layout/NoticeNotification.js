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
import Notice from '../../../../components/Notice';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import { Grid, Cell, Row } from '../../../../material-components';
import propTypes from 'prop-types';

export default function NoticeNotification( {
	notificationID,
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
		trackEvents.confirm();
	};

	return (
		<Grid>
			<Row>
				<Cell alignMiddle size={ 12 }>
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
	dismissButton: propTypes.object,
	ctaButton: propTypes.object,
};
