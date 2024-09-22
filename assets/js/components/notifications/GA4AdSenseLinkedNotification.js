/**
 * GA4AdSenseLinkedNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';

export default function GA4AdSenseLinkedNotification( { id, Notification } ) {
	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Your AdSense and Analytics accounts are linked.',
					'google-site-kit'
				) }
				description={ __(
					'We’ll let you know as soon as there’s enough data available.',
					'google-site-kit'
				) }
				dismissCTA={ <Dismiss id={ id } /> }
			/>
		</Notification>
	);
}
