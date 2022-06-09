/**
 * DashboardNotifications component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useFeature } from '../../hooks/useFeature';
/**
 * Internal dependencies
 */
import { getQueryParameter } from '../../util';
import CoreSiteBannerNotifications from '../notifications/CoreSiteBannerNotifications';
import SetupSuccessBannerNotification from '../notifications/SetupSuccessBannerNotification';
import UserInputPromptBannerNotification from '../notifications/UserInputPromptBannerNotification';

export default function DashboardNotifications() {
	const userInputEnabled = useFeature( 'userInput' );
	const notification = getQueryParameter( 'notification' );

	return (
		<Fragment>
			{ userInputEnabled && <UserInputPromptBannerNotification /> }
			{ ( 'authentication_success' === notification ||
				'authentication_failure' === notification ||
				'user_input_success' === notification ) && (
				<SetupSuccessBannerNotification />
			) }
			<CoreSiteBannerNotifications />
		</Fragment>
	);
}
