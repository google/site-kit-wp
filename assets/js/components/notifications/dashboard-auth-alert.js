/**
 * DashboardAuthAlert component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import Notification from 'GoogleComponents/notifications/notification';

const { __ } = wp.i18n;

const DashboardAuthAlert = () => {
	const { admin: { connectUrl } } = googlesitekit;
	return (
		<Notification
			id="authentication error"
			title={ __( 'Issue accessing data', 'google-site-kit' ) }
			description={ __( 'You need to reauthenticate your Google account.', 'google-site-kit' ) }
			handleDismiss={ () => {} }
			format="small"
			type="win-error"
			isDismissable={ true }
			ctaLink={ connectUrl }
			ctaLabel={ __( 'Click here', 'google-site-kit' ) }
		/>
	);
};

export default DashboardAuthAlert;
