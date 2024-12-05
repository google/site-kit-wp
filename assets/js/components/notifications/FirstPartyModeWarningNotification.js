/**
 * FirstPartyModeWarningNotification component.
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import SupportLink from '../SupportLink';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';

export default function FirstPartyModeWarningNotification( {
	id,
	Notification,
} ) {
	return (
		<Notification>
			<SubtleNotification
				description={ createInterpolateElement(
					__(
						'First-party mode has been disabled due to server configuration issues. Measurement data is now being routed through the default Google server. Please contact your hosting provider to resolve the issue. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						// ToDo: Update learn more link in https://github.com/google/site-kit-wp/issues/9699
						a: <SupportLink path="/analytics/answer/10096855" />,
					}
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					/>
				}
				type="warning"
			/>
		</Notification>
	);
}
