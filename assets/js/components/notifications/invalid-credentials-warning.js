/**
 * InvalidCredentialsWarning component.
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

/**
 * External dependencies
 */
import Notification from 'GoogleComponents/notifications/notification';

const { Component } = wp.element;
const { __ } = wp.i18n;

class InvalidCredentialsWarning extends Component {
	render() {
		return (
			<Notification
				id="notification-id"
				title={ __( 'Security Token Error', 'google-site-kit' ) }
				description={ __( 'We’re unable to retrieve your data because your security token is expired or revoked. Please ', 'google-site-kit' ) }
				learnMoreURL={ googlesitekit.admin.connectURL }
				learnMoreLabel={ __( 'reauthenticate your account', 'google-site-kit' ) }
				format="small"
				type="win-error"
			/>
		);
	}
}

export default InvalidCredentialsWarning;
