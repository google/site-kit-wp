/**
 * SetupErrorNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import NotificationError from '../../googlesitekit/notifications/components/layout/NotificationError';
import Description from '../../googlesitekit/notifications/components/common/Description';
import CTALink from '../../googlesitekit/notifications/components/common/CTALink';

export default function SetupErrorNotification( { id, Notification } ) {
	// These will be `null` if no errors exist.
	const setupErrorMessage = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorMessage()
	);
	const setupErrorRedoURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorRedoURL()
	);

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error">
			<NotificationError
				title={ __(
					'Oops! There was a problem during set up. Please try again.',
					'google-site-kit'
				) }
				description={ <Description text={ setupErrorMessage } /> }
				actions={
					setupErrorRedoURL && (
						<CTALink
							id={ id }
							ctaLabel={ __(
								'Redo the plugin setup',
								'google-site-kit'
							) }
							ctaLink={ setupErrorRedoURL }
						/>
					)
				}
			/>
		</Notification>
	);
}
