/**
 * Dashboard Sharing Feature Tour.
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
import { __ } from '@wordpress/i18n';
import { EVENTS, ACTIONS, STATUS } from 'react-joyride';

/*
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';
import settingsTour from './dashboard-sharing-settings';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { SETTINGS_DIALOG } from '../components/dashboard-sharing/DashboardSharingSettings/constants';

let viewedAllSteps;

const dashboardSharing = {
	slug: 'dashboardSharing',
	contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	version: '1.85.0',
	gaEventCategory: ( viewContext ) => `${ viewContext }_dashboard-sharing`,
	steps: [
		{
			target: '.googlesitekit-sharing-settings__button',
			title: __( 'New! Dashboard sharing', 'google-site-kit' ),
			content: __(
				'Share a view-only version of your dashboard with other WordPress roles',
				'google-site-kit'
			),
			placement: 'bottom-start',
		},
		...settingsTour.steps,
	],
	callback: ( data, { select, dispatch } ) => {
		const { action, index, size, type, status } = data;

		const dialogOpen = select( CORE_UI ).getValue( SETTINGS_DIALOG );

		// Open sharing settings when transitioning to the second step from the first.
		if ( ACTIONS.NEXT === action && index === 0 ) {
			dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );
		}

		// Close the dialog if the tour is ended or we end up back on the first step.
		if (
			ACTIONS.STOP === action ||
			ACTIONS.CLOSE === action ||
			( index === 0 && dialogOpen ) ||
			( action === ACTIONS.NEXT && status === STATUS.FINISHED )
		) {
			dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, false );
		}

		if (
			index + 1 === size &&
			EVENTS.TOOLTIP === type &&
			! viewedAllSteps
		) {
			viewedAllSteps = true;
			// If the user has "seen" all the steps, dismiss the settings tour.
			dispatch( CORE_USER ).dismissTour( settingsTour.slug );
		}
	},
};

export default dashboardSharing;
