/**
 * SettingsCardVisitorGroups SetupSuccess component.
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
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import CheckFill from '../../../../../../../svg/icons/check-fill.svg';

export const SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION =
	'settings_visitor_groups_setup_success_notification';

export default function SetupSuccess() {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION
		)
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { dismissItem } = useDispatch( CORE_USER );

	function dismissNotificationForUser() {
		return dismissItem(
			SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION
		);
	}

	function scrollToWidgetArea() {
		dismissNotificationForUser().then( () => navigateTo( dashboardURL ) );

		// TODO: Scrolling to the widget area will be implemented in a subsequent issue.
	}

	if ( isDismissed ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-visitor-groups__setup-success googlesitekit-subtle-notification">
			<div className="googlesitekit-subtle-notification__icon">
				<CheckFill width={ 24 } height={ 24 } />
			</div>
			<div className="googlesitekit-subtle-notification__content">
				<p>
					{ __(
						'We’ve added the audiences section to your dashboard!',
						'google-site-kit'
					) }
				</p>
			</div>
			<Button tertiary onClick={ dismissNotificationForUser }>
				{ __( 'Got it', 'google-site-kit' ) }
			</Button>
			<Button onClick={ scrollToWidgetArea }>
				{ __( 'Show me', 'google-site-kit' ) }
			</Button>
		</div>
	);
}
