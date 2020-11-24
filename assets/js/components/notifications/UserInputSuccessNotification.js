/**
 * UserInputSuccessNotification component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Notification from '../notifications/notification';
import UserInputSuccessImage from '../../../svg/congrats.svg';

export default function UserInputSuccessNotification() {
	return (
		<Notification
			id="user-input-success"
			title={ __( 'Congrats! You set your site goals.', 'google-site-kit' ) }
			description={ __( 'Now Site Kit will begin showing you suggestions how to add more metrics to your dashboard that are relevant specifically to you, based on the goals you shared.', 'google-site-kit' ) }
			smallImage={ <UserInputSuccessImage /> }
			dismiss={ __( 'OK, got it!', 'google-site-kit' ) }
			format="small"
		/>
	);
}
