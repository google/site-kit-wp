/**
 * DashboardSharingDialog component.
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
import { __ } from '@wordpress/i18n';
import {
	createInterpolateElement,
	useEffect,
	useCallback,
	useRef,
	useState,
} from '@wordpress/element';
import { arrowLeft, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	EDITING_USER_ROLE_SELECT_SLUG_KEY,
	RESET_SETTINGS_DIALOG,
	SETTINGS_DIALOG,
} from '../DashboardSharingSettings/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../../hooks/useBreakpoint';
import useDialogEscapeAndScrim from '../../../hooks/useDialogEscapeAndScrim';
import sharingSettingsTour from '../../../feature-tours/dashboard-sharing-settings';
import Portal from '../../Portal';
import {
	Dialog,
	DialogContent,
	DialogFooter,
} from '../../../material-components';
import ShareIcon from '../../../../svg/icons/share.svg';
import Link from '../../Link';
import DashboardSharingSettings from '../DashboardSharingSettings';
import Footer from './Footer';

export default function DashboardSharingDialog() {
	const [ shouldFocusResetButton, setShouldFocusResetButton ] =
		useState( false );

	const breakpoint = useBreakpoint();
	const { y } = useWindowScroll();

	const { setValue } = useDispatch( CORE_UI );
	const { triggerOnDemandTour } = useDispatch( CORE_USER );
	const { rollbackSharingSettings } = useDispatch( CORE_MODULES );

	const settingsDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( SETTINGS_DIALOG )
	);
	const resetDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
	);
	const editingUserRoleSelect = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);
	const haveSettingsChanged = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsChanged()
	);
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing'
		);
	} );

	useEffect( () => {
		if ( shouldFocusResetButton ) {
			const resetButton = document.querySelector(
				'.googlesitekit-reset-sharing-permissions-button'
			);
			if ( resetButton ) {
				resetButton.focus();
			}
			setShouldFocusResetButton( false );
		}
	}, [ shouldFocusResetButton ] );

	const triggeredTourRef = useRef();
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

	// Rollback any temporary selections to saved values if settings have changed and modal is closed.
	useEffect( () => {
		if ( ! settingsDialogOpen && haveSettingsChanged ) {
			rollbackSharingSettings();
		}
	}, [ settingsDialogOpen, haveSettingsChanged, rollbackSharingSettings ] );

	const openSettingsDialog = useCallback( () => {
		setValue( SETTINGS_DIALOG, true );
	}, [ setValue ] );

	const closeSettingsDialog = useCallback( () => {
		setValue( SETTINGS_DIALOG, false );
		setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
	}, [ setValue ] );

	const openResetDialog = useCallback( () => {
		closeSettingsDialog();
		setValue( RESET_SETTINGS_DIALOG, true );
	}, [ closeSettingsDialog, setValue ] );

	const closeResetDialog = useCallback( () => {
		setValue( RESET_SETTINGS_DIALOG, false );
		openSettingsDialog();
		setShouldFocusResetButton( true );
	}, [ openSettingsDialog, setValue ] );

	const closeDialog = useCallback( () => {
		if ( resetDialogOpen ) {
			closeResetDialog();
			return null;
		}

		closeSettingsDialog();
	}, [ closeResetDialog, closeSettingsDialog, resetDialogOpen ] );

	// Handle escape key and scrim click for reset dialog.
	useDialogEscapeAndScrim( closeResetDialog, resetDialogOpen );

	return (
		<Portal>
			<Dialog
				open={ settingsDialogOpen || resetDialogOpen }
				onOpen={ handleTriggerOnDemandTour }
				onClose={ closeDialog }
				className="googlesitekit-dialog googlesitekit-sharing-settings-dialog"
				style={ dialogStyles }
				// Prevent default modal behavior as we are simulating multiple modals within a single modal here for the settings and reset dialogs.
				escapeKeyAction={
					editingUserRoleSelect === undefined && ! resetDialogOpen
						? 'close'
						: ''
				}
				scrimClickAction={
					editingUserRoleSelect === undefined && ! resetDialogOpen
						? 'close'
						: ''
				}
			>
				<div
					className="googlesitekit-dialog__back-wrapper"
					aria-hidden={ breakpoint !== BREAKPOINT_SMALL }
				>
					<Button
						aria-label={ __( 'Back', 'google-site-kit' ) }
						className="googlesitekit-dialog__back"
						onClick={ closeDialog }
					>
						<Icon icon={ arrowLeft } />
					</Button>
				</div>
				<DialogContent className="googlesitekit-dialog__content">
					<div className="googlesitekit-dialog__header">
						{ settingsDialogOpen && (
							<div
								className="googlesitekit-dialog__header-icon"
								aria-hidden={ breakpoint === BREAKPOINT_SMALL }
							>
								<span>
									<ShareIcon width={ 20 } height={ 20 } />
								</span>
							</div>
						) }

						<div className="googlesitekit-dialog__header-titles">
							<h2 className="googlesitekit-dialog__title">
								{ settingsDialogOpen &&
									__(
										'Dashboard sharing & permissions',
										'google-site-kit'
									) }

								{ resetDialogOpen &&
									__(
										'Reset Dashboard Sharing permissions',
										'google-site-kit'
									) }
							</h2>

							<p
								className={ classnames(
									'googlesitekit-dialog__subtitle',
									{
										'googlesitekit-dialog__subtitle--emphasis':
											resetDialogOpen,
									}
								) }
							>
								{ settingsDialogOpen &&
									createInterpolateElement(
										__(
											'Share a view-only version of your Site Kit dashboard with other WordPress roles. <a>Learn more</a>',
											'google-site-kit'
										),
										{
											a: (
												<Link
													aria-label={ __(
														'Learn more about dashboard sharing',
														'google-site-kit'
													) }
													href={ documentationURL }
													external
												/>
											),
										}
									) }

								{ resetDialogOpen &&
									__(
										'Warning: Resetting these permissions will remove view-only access for all users. Are you sure you want to reset all Dashboard Sharing permissions?',
										'google-site-kit'
									) }
							</p>
						</div>
					</div>

					{ settingsDialogOpen && (
						<div className="googlesitekit-dialog__main">
							<DashboardSharingSettings />
						</div>
					) }
				</DialogContent>
				<DialogFooter className="googlesitekit-dialog__footer">
					<Footer
						closeDialog={ closeDialog }
						openResetDialog={ openResetDialog }
					/>
				</DialogFooter>
			</Dialog>
		</Portal>
	);
}
