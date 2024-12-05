/**
 * AuthError component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import NotificationError from '../../googlesitekit/notifications/components/layout/NotificationError';
import CTALink from '../../googlesitekit/notifications/components/common/CTALink';
import Description from '../../googlesitekit/notifications/components/common/Description';

export default function AuthError( { id, Notification } ) {
	const error = useSelect( ( select ) => select( CORE_USER ).getAuthError() );

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error">
			<NotificationError
				title={ __(
					'Site Kit can’t access necessary data',
					'google-site-kit'
				) }
				description={ <Description text={ error.message } /> }
				actions={
					<CTALink
						id={ id }
						ctaLabel={ __(
							'Redo the plugin setup',
							'google-site-kit'
						) }
						ctaLink={ error.data.reconnectURL }
					/>
				}
			/>
		</Notification>
	);
}
