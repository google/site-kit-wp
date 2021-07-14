/**
 * Notification initialization.
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
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { isFeatureEnabled } from '../../features';
import { createAddToFilter } from '../../util/helpers';
import { getQueryParameter } from '../../util';
import DashboardCoreSiteAlerts from './DashboardCoreSiteAlerts';
import DashboardSetupAlerts from './dashboard-setup-alerts';
import DashboardModulesAlerts from './dashboard-modules-alerts';
import UserInputPromptNotification from '../notifications/UserInputPromptNotification';
import IdeaHubModuleNotification from '../notifications/IdeaHubModuleNotification';

const { setup } = global._googlesitekitLegacyData;
const notification = getQueryParameter( 'notification' );

const addCoreSiteNotifications = createAddToFilter( <DashboardCoreSiteAlerts /> );
const addSetupNotifications = createAddToFilter( <DashboardSetupAlerts /> );
const addModulesNotifications = createAddToFilter( <DashboardModulesAlerts /> );
const addUserInputPrompt = createAddToFilter( <UserInputPromptNotification /> );
const addIdeaHubModuleNotification = createAddToFilter( <IdeaHubModuleNotification /> );

addFilter( 'googlesitekit.DashboardNotifications',
	'googlesitekit.SetupNotification',
	addCoreSiteNotifications, 10 );

if ( isFeatureEnabled( 'userInput' ) ) {
	addFilter( 'googlesitekit.DashboardNotifications',
		'googlesitekit.UserInputSettings',
		addUserInputPrompt, 1 );
}

if ( isFeatureEnabled( 'ideaHubModule' ) && 'authentication_success' !== notification && 'authentication_failure' !== notification ) {
	addFilter( 'googlesitekit.DashboardNotifications',
		'googlesitekit.IdeaHubModule',
		addIdeaHubModuleNotification, 1 );
}

if ( 'authentication_success' === notification || 'authentication_failure' === notification || 'user_input_success' === notification ) {
	addFilter( 'googlesitekit.DashboardNotifications',
		'googlesitekit.SetupNotification',
		addSetupNotifications, 1 );
} else if ( setup.isAuthenticated && setup.isVerified ) {
	addFilter( 'googlesitekit.DashboardNotifications',
		'googlesitekit.ModulesNotification',
		addModulesNotifications, 1 );
}
