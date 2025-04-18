/**
 * ErrorNotifications component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InternalServerError from './InternalServerError';
import Notifications from './Notifications';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';

export default function ErrorNotifications() {
	return (
		<Fragment>
			{ /* We will eventually refactor the InternalServerError component to not show
			 in the usual Banner Notification area but as a floating snackbar in BNR3. This
			 is why it has not been added to the new queue of notifications. */ }
			<InternalServerError />
			<Notifications areaSlug={ NOTIFICATION_AREAS.ERRORS } />
		</Fragment>
	);
}
