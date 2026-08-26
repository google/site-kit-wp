/**
 * ManageEmailReportsButton component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import {
	MANAGE_EMAIL_REPORTS_BUTTON_CLASS,
	USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/components/email-reporting/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useIsInitialSetupFlow from '@/js/hooks/useIsInitialSetupFlow';
import useViewOnly from '@/js/hooks/useViewOnly';
import EmailReportIcon from '@/svg/icons/email-report.svg';
import { SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION } from './SetUpEmailReportingOverlayNotification';

const ManageEmailReportsButton: FC = () => {
	const viewOnlyDashboard = useViewOnly();
	const isInitialSetupFlow = useIsInitialSetupFlow();

	const hasEmailReportingDataAccess = useSelect(
		( select: Select ) => {
			// Only view-only users are subject to this check, and resolving viewable
			// modules elsewhere would request capabilities the current user already has.
			if ( ! viewOnlyDashboard ) {
				return false;
			}

			const viewableModules = select( CORE_USER ).getViewableModules();

			if ( viewableModules === undefined ) {
				return undefined;
			}

			return (
				viewableModules.includes( 'analytics-4' ) ||
				viewableModules.includes( 'search-console' )
			);
		},
		[ viewOnlyDashboard ]
	);

	const isSetupTooltipVisible = useSelect( ( select: Select ) => {
		const tooltip = select( CORE_UI ).getValue( 'admin-screen-tooltip' );

		return (
			!! tooltip?.isTooltipVisible &&
			tooltip?.tooltipSlug === SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION
		);
	}, [] );

	const { setValue } = useDispatch( CORE_UI );

	const openPanel = useCallback( () => {
		// The setup tooltip anchors to this button and renders above the panel, so
		// leaving it up would float it over the sheet pointing at a covered icon.
		if ( isSetupTooltipVisible ) {
			setValue( 'admin-screen-tooltip', undefined );
		}

		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ isSetupTooltipVisible, setValue ] );

	const shouldRender = viewOnlyDashboard
		? !! hasEmailReportingDataAccess
		: ! isInitialSetupFlow;

	if ( ! shouldRender ) {
		return null;
	}

	return (
		<Button
			aria-label={ __( 'Manage email reports', 'google-site-kit' ) }
			// @ts-expect-error - The `Button` component is not typed yet.
			className={ `${ MANAGE_EMAIL_REPORTS_BUTTON_CLASS } googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon` }
			onClick={ openPanel }
			icon={ <EmailReportIcon width={ 20 } height={ 20 } /> }
			tooltipEnterDelayInMS={ 500 }
			tertiary
		/>
	);
};

export default ManageEmailReportsButton;
