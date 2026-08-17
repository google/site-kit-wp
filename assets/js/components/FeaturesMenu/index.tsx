/**
 * FeaturesMenu component.
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
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Button, Menu } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import DashboardSharingDialog from '@/js/components/dashboard-sharing/DashboardSharingDialog';
import { SETTINGS_DIALOG } from '@/js/components/dashboard-sharing/DashboardSharingSettings/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION } from '@/js/components/email-reporting/SetUpEmailReportingOverlayNotification';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useIsInitialSetupFlow from '@/js/hooks/useIsInitialSetupFlow';
import { useKeyCodesInside } from '@/js/hooks/useKeyCodesInside';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { trackEvent } from '@/js/util';
import DownloadIcon from '@/svg/icons/download.svg';
import EmailReportIcon from '@/svg/icons/email-report.svg';
import MoreVerticalIcon from '@/svg/icons/more-vertical.svg';
import ShareIcon from '@/svg/icons/share.svg';
import { FEATURES_MENU_BUTTON_CLASS } from './constants';
import FeaturesMenuItem from './FeaturesMenuItem';

const FeaturesMenu: FC = () => {
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef< HTMLDivElement | null >( null );
	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();
	const isInitialSetupFlow = useIsInitialSetupFlow();
	const pdfGenerationEnabled = useFeature( 'pdfGeneration' );

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () =>
		setMenuOpen( false )
	);

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

	const hasMultipleAdmins = useSelect(
		( select: Select ) => select( CORE_SITE ).hasMultipleAdmins(),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	const handleMenu = useCallback( () => {
		if ( ! menuOpen ) {
			trackEvent( `${ viewContext }_headerbar`, 'open_featuresmenu' );
		}

		setMenuOpen( ! menuOpen );
	}, [ menuOpen, viewContext ] );

	const handleMenuSelected = useCallback( () => {
		setMenuOpen( false );
	}, [] );

	const openEmailReportsPanel = useCallback( () => {
		// The setup tooltip anchors to the menu button and renders above the
		// panel, so leaving it up would float it over the sheet pointing at a
		// covered icon.
		if ( isSetupTooltipVisible ) {
			setValue( 'admin-screen-tooltip', undefined );
		}

		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ isSetupTooltipVisible, setValue ] );

	const openSharingSettings = useCallback( () => {
		trackEvent(
			`${ viewContext }_headerbar`,
			'open_sharing',
			hasMultipleAdmins ? 'advanced' : 'simple'
		);

		setValue( SETTINGS_DIALOG, true );
	}, [ hasMultipleAdmins, setValue, viewContext ] );

	const openPDFDownloadPanel = useCallback( () => {
		trackEvent(
			`${ viewContext }_headerbar`,
			'open_pdf_generation_sidebar'
		);

		setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
	}, [ setValue, viewContext ] );

	const showEmailReportsItem = viewOnlyDashboard
		? !! hasEmailReportingDataAccess
		: ! isInitialSetupFlow;
	const showSharingItem = ! viewOnlyDashboard;
	const showPDFItem = pdfGenerationEnabled;

	if ( ! showEmailReportsItem && ! showSharingItem && ! showPDFItem ) {
		return null;
	}

	return (
		<Fragment>
			<div
				ref={ menuWrapperRef }
				className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu googlesitekit-features-menu mdc-menu-surface--anchor"
			>
				<Button
					aria-controls="googlesitekit-features-menu"
					aria-expanded={ menuOpen }
					aria-label={ __( 'Features', 'google-site-kit' ) }
					aria-haspopup="menu"
					// @ts-expect-error - The `Button` component is not typed yet.
					className={ `googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon ${ FEATURES_MENU_BUTTON_CLASS } mdc-button--dropdown` }
					icon={ <MoreVerticalIcon width="20" height="20" /> }
					onClick={ handleMenu }
					tooltipEnterDelayInMS={ 500 }
					text
				/>
				{
					// @ts-expect-error - The `Menu` component is not typed yet.
					<Menu
						className="googlesitekit-width-auto googlesitekit-features-menu__menu"
						menuOpen={ menuOpen }
						id="googlesitekit-features-menu"
						onSelected={ handleMenuSelected }
					>
						{ showEmailReportsItem && (
							<FeaturesMenuItem
								icon={
									<EmailReportIcon
										width={ 20 }
										height={ 20 }
									/>
								}
								onClick={ openEmailReportsPanel }
							>
								{ __(
									'Manage email reports',
									'google-site-kit'
								) }
							</FeaturesMenuItem>
						) }
						{ showSharingItem && (
							<FeaturesMenuItem
								icon={
									<ShareIcon width={ 20 } height={ 20 } />
								}
								onClick={ openSharingSettings }
							>
								{ __(
									'Dashboard sharing settings',
									'google-site-kit'
								) }
							</FeaturesMenuItem>
						) }
						{ showPDFItem && (
							<FeaturesMenuItem
								icon={
									<DownloadIcon width={ 20 } height={ 20 } />
								}
								onClick={ openPDFDownloadPanel }
							>
								{ __(
									'Download PDF report',
									'google-site-kit'
								) }
							</FeaturesMenuItem>
						) }
					</Menu>
				}
			</div>
			{ showSharingItem && <DashboardSharingDialog /> }
		</Fragment>
	);
};

export default FeaturesMenu;
