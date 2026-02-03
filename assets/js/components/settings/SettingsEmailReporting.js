/**
 * SettingsEmailReporting component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useCallback,
	useState,
	createInterpolateElement,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Cell, Row } from '@/js/material-components';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import RefocusableModalDialog from '@/js/components/RefocusableModalDialog';
import EmailReportingCardNotice, {
	EMAIL_REPORTING_CARD_NOTICE,
} from '@/js/components/email-reporting/notices/EmailReportingCardNotice';
import AnalyticsDisconnectedNotice from '@/js/components/email-reporting/notices/AnalyticsDisconnectedNotice';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import EmailReportingErrorNotice from '@/js/components/email-reporting/notices/EmailReportingErrorNotices';

export default function SettingsEmailReporting( { loading = false } ) {
	const viewContext = useViewContext();
	const [ isDisableDialogOpen, setIsDisableDialogOpen ] = useState( false );

	const isEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const settings = useSelect( ( select ) =>
		select( CORE_SITE ).getEmailReportingSettings()
	);

	const isSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( EMAIL_REPORTING_CARD_NOTICE )
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'email-reporiting' )
	);

	const { setEmailReportingEnabled, saveEmailReportingSettings } =
		useDispatch( CORE_SITE );

	const { setValue } = useDispatch( CORE_UI );

	const handleToggle = useCallback( async () => {
		if ( isEnabled ) {
			setIsDisableDialogOpen( true );
			return;
		}

		trackEvent(
			`${ viewContext }_email_reports_settings`,
			'activate_periodic_email_reports'
		);

		await setEmailReportingEnabled( true );
		await saveEmailReportingSettings();
	}, [
		isEnabled,
		setEmailReportingEnabled,
		saveEmailReportingSettings,
		viewContext,
	] );

	const handleDisableConfirm = useCallback( async () => {
		trackEvent(
			`${ viewContext }_email_reports_settings`,
			'deactivate_periodic_email_reports'
		);
		setIsDisableDialogOpen( false );
		await setEmailReportingEnabled( false );
		await saveEmailReportingSettings();
	}, [ saveEmailReportingSettings, setEmailReportingEnabled, viewContext ] );

	const handleDisableCancel = useCallback( () => {
		setIsDisableDialogOpen( false );
	}, [] );

	const handleManageClick = useCallback( () => {
		trackEvent(
			`${ viewContext }_email_reports_settings`,
			'manage_email_reports_subscription'
		);
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
		handleDisableCancel();
	}, [ setValue, viewContext, handleDisableCancel ] );

	if ( loading || settings === undefined ) {
		return null;
	}

	return (
		<Fragment>
			<Row>
				<Cell size={ 12 }>
					<div className="googlesitekit-settings-email-reporting__switch">
						<Switch
							label={
								<Fragment>
									<Typography
										type="body"
										size="medium"
										className="googlesitekit-settings-email-reporting__label"
									>
										{ __(
											'Enable email reports',
											'google-site-kit'
										) }
									</Typography>
									<br />
									<Typography
										type="body"
										size="medium"
										className="googlesitekit-settings-email-reporting__label-description"
									>
										{ createInterpolateElement(
											__(
												'This allows you and any dashboard sharing user to subscribe to email reports. <a>Learn more</a>',
												'google-site-kit'
											),
											{
												a: (
													<Link
														href={
															documentationURL
														}
														external
													/>
												),
											}
										) }
									</Typography>
								</Fragment>
							}
							checked={ isEnabled }
							onClick={ handleToggle }
							hideLabel={ false }
						/>
					</div>
				</Cell>
			</Row>
			{ /* Show the introductory notice if notice is not dismissed and user is not already subscribed */ }
			{ isEnabled &&
				settings !== undefined &&
				! isSubscribed &&
				isDismissed === false && (
					<Row className="googlesitekit-settings-email-reporting__manage">
						<Cell size={ 12 }>
							<EmailReportingCardNotice />
						</Cell>
					</Row>
				) }
			{ /* Show manage email reports link if notice is dismissed or user is already subscribed */ }
			{ isEnabled &&
				settings !== undefined &&
				isDismissed !== undefined &&
				( isSubscribed || isDismissed !== false ) && (
					<Row className="googlesitekit-settings-email-reporting__manage">
						<Cell size={ 12 }>
							<Link onClick={ handleManageClick }>
								{ __(
									'Manage email reports subscription',
									'google-site-kit'
								) }
							</Link>
						</Cell>
					</Row>
				) }
			<EmailReportingErrorNotice />
			<AnalyticsDisconnectedNotice />
			{ isDisableDialogOpen && (
				<RefocusableModalDialog
					className="googlesitekit-settings-email-reporting__confirm-disable-modal"
					title={ __(
						'Are you sure you want to disable email reports?',
						'google-site-kit'
					) }
					subtitle={
						<Fragment>
							<span>
								{ __(
									'Disabling email reports will pause sending email reports for all subscribed users.',
									'google-site-kit'
								) }
							</span>
							<br />
							{ createInterpolateElement(
								__(
									'You can manage your subscription in your <a>email report settings</a>.',
									'google-site-kit'
								),
								{
									a: <Link onClick={ handleManageClick } />,
								}
							) }
							<br />
							{ /** TODO update learn more link when it is provided. */ }
							<Link href="">
								{ __( 'Learn more', 'google-site-kit' ) }
							</Link>
						</Fragment>
					}
					handleConfirm={ handleDisableConfirm }
					handleCancel={ handleDisableCancel }
					onClose={ handleDisableCancel }
					confirmButton={ __( 'Disable', 'google-site-kit' ) }
					dialogActive
				/>
			) }
		</Fragment>
	);
}

SettingsEmailReporting.propTypes = {
	loading: PropTypes.bool,
};
