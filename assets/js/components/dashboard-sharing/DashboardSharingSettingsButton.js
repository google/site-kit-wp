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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useEffect,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../Link';
import Button from '../Button';
import Portal from '../Portal';
import ShareIcon from '../../../svg/icons/share.svg';
import Footer from './DashboardSharingSettings/Footer';
import useViewContext from '../../hooks/useViewContext';
import DashboardSharingSettings from './DashboardSharingSettings';
import ResetSharingSettings, {
	RESET_SHARING_DIALOG_OPEN,
} from './ResetSharingSettings';
import { trackEvent } from '../../util';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import { Dialog, DialogContent, DialogFooter } from '../../material-components';
import { EDITING_USER_ROLE_SELECT_SLUG_KEY } from './DashboardSharingSettings/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import sharingSettingsTour from '../../feature-tours/dashboard-sharing-settings';
const { useSelect, useDispatch } = Data;

export const UI_KEY_DIALOG_OPEN = 'dashboardSharingDialogOpen';

export default function DashboardSharingSettingsButton() {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();
	const { y } = useWindowScroll();
	const { setValue } = useDispatch( CORE_UI );

	const dialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( UI_KEY_DIALOG_OPEN )
	);
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);
	const haveSettingsChanged = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsChanged()
	);
	const editingUserRoleSelect = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);

	const openDialog = useCallback( () => {
		trackEvent(
			`${ viewContext }_headerbar`,
			'open_sharing',
			hasMultipleAdmins ? 'advanced' : 'simple'
		);

		setValue( UI_KEY_DIALOG_OPEN, true );
	}, [ setValue, viewContext, hasMultipleAdmins ] );

	const closeDialog = useCallback( () => {
		setValue( UI_KEY_DIALOG_OPEN, false );

		setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
	}, [ setValue ] );

	const openResetDialog = useCallback( () => {
		closeDialog();

		setValue( RESET_SHARING_DIALOG_OPEN, true );
	}, [ closeDialog, setValue ] );

	// Rollback any temporary selections to saved values if settings have changed and modal is closed.
	const { rollbackSharingSettings } = useDispatch( CORE_MODULES );
	useEffect( () => {
		if ( ! dialogOpen && haveSettingsChanged ) {
			rollbackSharingSettings();
		}
	}, [ dialogOpen, haveSettingsChanged, rollbackSharingSettings ] );

	const triggeredTourRef = useRef();
	const { triggerOnDemandTour } = useDispatch( CORE_USER );
	useEffect( () => {
		if ( dialogOpen && ! triggeredTourRef.current ) {
			triggeredTourRef.current = true;
			triggerOnDemandTour( sharingSettingsTour );
		}
	}, [ dialogOpen, triggerOnDemandTour ] );

	const dialogStyles = {};
	// On mobile, the dialog box's flexbox is set to stretch items within to cover
	// the whole screen. But we have to move the box and adjust its height below the
	// WP Admin bar of 46px which gradually scrolls off the screen.
	if ( breakpoint === BREAKPOINT_SMALL ) {
		dialogStyles.top = `${ y < 46 ? 46 - y : 0 }px`;
		dialogStyles.height = `calc(100% - 46px + ${ y < 46 ? y : 46 }px)`;
	}

	return (
		<Fragment>
			<Button
				aria-label={ __( 'Open sharing settings', 'google-site-kit' ) }
				className="googlesitekit-sharing-settings__button googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon"
				onClick={ openDialog }
				icon={ <ShareIcon width={ 20 } height={ 20 } /> }
			/>

			<Portal>
				<Dialog
					open={ dialogOpen }
					onClose={ closeDialog }
					className="googlesitekit-dialog googlesitekit-sharing-settings-dialog"
					style={ dialogStyles }
					escapeKeyAction={
						editingUserRoleSelect === undefined ? 'close' : ''
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
							<div
								className="googlesitekit-dialog__header-icon"
								aria-hidden={ breakpoint === BREAKPOINT_SMALL }
							>
								<span>
									<ShareIcon width={ 20 } height={ 20 } />
								</span>
							</div>

							<div className="googlesitekit-dialog__header-titles">
								<h2 className="googlesitekit-dialog__title">
									{ __(
										'Dashboard sharing & permissions',
										'google-site-kit'
									) }
								</h2>

								<p className="googlesitekit-dialog__subtitle">
									{ createInterpolateElement(
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
													href="https://sitekit.withgoogle.com/documentation/using-site-kit/dashboard-sharing/"
													external
												/>
											),
										}
									) }
								</p>
							</div>
						</div>

						<div className="googlesitekit-dialog__main">
							<DashboardSharingSettings />
						</div>
					</DialogContent>

					<DialogFooter className="googlesitekit-dialog__footer">
						<Footer
							closeDialog={ closeDialog }
							openResetDialog={ openResetDialog }
						/>
					</DialogFooter>
				</Dialog>

				<ResetSharingSettings />
			</Portal>
		</Fragment>
	);
}
