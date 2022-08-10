/**
 * DashboardSharingSettingsButton component.
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
import { useWindowScroll } from 'react-use';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Portal from '../../Portal';
import ResetSharingSettings from './ResetSharingSettings';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../../hooks/useBreakpoint';
import { Dialog } from '../../../material-components';
import {
	EDITING_USER_ROLE_SELECT_SLUG_KEY,
	RESET_SETTINGS_DIALOG,
	SETTINGS_DIALOG,
} from '../DashboardSharingSettings/constants';
import SharingSettings from './SharingSettings';
import sharingSettingsTour from '../../../feature-tours/dashboard-sharing-settings';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
const { useSelect, useDispatch } = Data;

export default function DashboardSharingDialog() {
	const breakpoint = useBreakpoint();
	const { y } = useWindowScroll();
	const { setValue } = useDispatch( CORE_UI );

	const settingsDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( SETTINGS_DIALOG )
	);
	const resetDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
	);
	const editingUserRoleSelect = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);

	const closeDialog = useCallback( () => {
		setValue( SETTINGS_DIALOG, false );
		setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
		setValue( RESET_SETTINGS_DIALOG, false );
	}, [ setValue ] );

	const triggeredTourRef = useRef();
	const { triggerOnDemandTour } = useDispatch( CORE_USER );
	const handleTriggerOnDemandTour = useCallback( () => {
		if ( ! triggeredTourRef.current ) {
			triggeredTourRef.current = true;
			triggerOnDemandTour( sharingSettingsTour );
		}
	}, [ triggerOnDemandTour ] );

	const dialogStyles = {};
	// On mobile, the dialog box's flexbox is set to stretch items within to cover
	// the whole screen. But we have to move the box and adjust its height below the
	// WP Admin bar of 46px which gradually scrolls off the screen.
	if ( breakpoint === BREAKPOINT_SMALL ) {
		dialogStyles.top = `${ y < 46 ? 46 - y : 0 }px`;
		dialogStyles.height = `calc(100% - 46px + ${ y < 46 ? y : 46 }px)`;
	}

	return (
		<Portal>
			<Dialog
				open={ settingsDialogOpen || resetDialogOpen }
				onOpen={ handleTriggerOnDemandTour }
				onClose={ closeDialog }
				className={ classnames(
					'googlesitekit-sharing-settings-dialog',
					{ 'googlesitekit-dialog': settingsDialogOpen }
				) }
				style={ dialogStyles }
				escapeKeyAction={
					editingUserRoleSelect === undefined ? 'close' : ''
				}
			>
				<Fragment>
					{ resetDialogOpen && <ResetSharingSettings /> }
					{ settingsDialogOpen && <SharingSettings /> }
				</Fragment>
			</Dialog>
		</Portal>
	);
}
