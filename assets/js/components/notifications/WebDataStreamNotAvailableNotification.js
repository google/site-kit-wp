/**
 * WebDataStreamNotAvailableNotification component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import SimpleNotification from '../../googlesitekit/notifications/components/layout/SimpleNotification';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MINUTE_IN_SECONDS } from '../../util';
import Description from '../../googlesitekit/notifications/components/common/Description';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';

export default function WebDataStreamNotAvailableNotification( {
	id,
	Notification,
} ) {
	const isWebDataStreamAvailable = false;

	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	// If the data stream is available, we don't have to show a warning to the user.
	if ( isWebDataStreamAvailable ) {
		return null;
	}

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error">
			<SimpleNotification
				title={ __(
					'Your Analytics configuration has changed',
					'google-site-kit'
				) }
				description={
					<Description
						text={ sprintf(
							/* translators: 1: Google Analytics Measurement ID. */
							__(
								'The previously selected web data stream with measurement ID %1$s is no longer available. Please select a new web data stream to continue collecting data with Google Analytics.',
								'google-site-kit'
							),
							measurementID
						) }
					/>
				}
				ctaLink={ `${ settingsURL }#connected-services/analytics-4/edit` }
				actions={
					<div>
						<ActionsCTALinkDismiss
							id={ id }
							ctaLabel={ __(
								'Update Analytics settings',
								'google-site-kit'
							) }
							ctaLink={ `${ settingsURL }#connected-services/analytics-4/edit` }
							dismissLabel={ __(
								'Maybe later',
								'google-site-kit'
							) }
							dismissExpires={ MINUTE_IN_SECONDS * 55 }
						/>
					</div>
				}
			/>
		</Notification>
	);
}

/*
ctaLink={ `${ settingsURL }#connected-services/analytics-4/edit` }
			ctaLabel={ __( 'Update Analytics settings', 'google-site-kit' ) }
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			// This is arbitrarily set to 55 minutes to ensure that the notification
			// will become ready to be displayed again in an hour.
			dismissExpires={ MINUTE_IN_SECONDS * 55 }
 */

/*
* if ( measurementID === undefined ) {
		// Wrap in the googlesitekit-publisher-win class to ensure the output is treated in the same way as BannerNotification,
		// with only one instance visible on the screen at a time.
		return (
			<div className="googlesitekit-publisher-win">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<ProgressBar />
						</Cell>
					</Row>
				</Grid>
			</div>
		);
	}*/
