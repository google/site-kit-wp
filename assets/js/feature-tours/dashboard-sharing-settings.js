/**
 * Dashboard Sharing Settings Feature Tour.
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
 * External dependencies
 */
import { EVENTS } from 'react-joyride';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
 * Internal dependencies
 */
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

const { hasMultipleAdmins } = global._googlesitekitUserData || {};

const steps = [
	{
		target: '.googlesitekit-dashboard-sharing-settings__main .googlesitekit-dashboard-sharing-settings__column--view',
		title: __( 'Manage view access for other roles', 'google-site-kit' ),
		content: __(
			'Grant access to the view-only dashboard for each service for the specific roles you want. Users will see the Site Kit dashboard with only the services that have been shared with them without needing to sign-in with Google.',
			'google-site-kit'
		),
		placement: 'auto',
	},
];

if ( hasMultipleAdmins ) {
	steps.push( {
		target: '.googlesitekit-dashboard-sharing-settings__main .googlesitekit-dashboard-sharing-settings__column--manage',
		title: __( 'Share management with other admins', 'google-site-kit' ),
		content: __(
			'By default only the user who connects a service can control who it is shared with. This setting optionally lets these users allow any other admin signed in with Google to manage the roles a service is shared with.',
			'google-site-kit'
		),
		placement: 'auto',
	} );
}

export default {
	slug: 'dashboardSharingSettings',
	gaEventCategory: ( viewContext ) => `${ viewContext }_dashboard-sharing`,
	steps,
	callback: ( { type }, { select, dispatch } ) => {
		if (
			EVENTS.TOOLTIP === type &&
			select( CORE_USER ).isTourDismissed( 'dashboardSharing' ) === false
		) {
			dispatch( CORE_USER ).dismissTour( 'dashboardSharing' );
		}
	},
};
