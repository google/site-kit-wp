/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import ErrorNotice from '../../../../../../components/ErrorNotice';
import Link from '../../../../../../components/Link';
import { CORE_LOCATION } from '../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';
import {
	AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../../../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function CreateMessageStep() {
	const viewContext = useViewContext();

	const adsenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ adsenseAccountID }/privacymessaging/ad_blocking`,
		} )
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const setupSuccessURL = addQueryArgs( dashboardURL, {
		notification: 'ad_blocking_recovery_setup_success',
	} );
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ADSENSE ).isDoingSaveSettings() ||
			select( CORE_LOCATION ).isNavigatingTo( setupSuccessURL )
	);
	const createMessageCTAClicked = useSelect(
		( select ) =>
			!! select( CORE_UI ).getValue(
				AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED
			)
	);
	const saveSettingsError = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getErrorForAction( 'saveSettings' )
	);

	const { saveSettings, setAdBlockingRecoverySetupStatus } =
		useDispatch( MODULES_ADSENSE );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setValue } = useDispatch( CORE_UI );

	const onCTAClick = useCallback( async () => {
		if ( ! createMessageCTAClicked ) {
			await trackEvent(
				`${ viewContext }_adsense-abr`,
				'create_message',
				'primary_cta'
			);
			setValue(
				AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
				true
			);
			return;
		}

		setAdBlockingRecoverySetupStatus(
			ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
		);

		const { error } = await saveSettings();

		if ( ! error ) {
			await trackEvent(
				`${ viewContext }_adsense-abr`,
				'confirm_message_ready'
			);

			navigateTo( setupSuccessURL );
		}
	}, [
		createMessageCTAClicked,
		navigateTo,
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setValue,
		setupSuccessURL,
		viewContext,
	] );

	useMount( () => {
		trackEvent( `${ viewContext }_adsense-abr`, 'setup_create_message' );
	} );

	useEffect( () => {
		if ( createMessageCTAClicked ) {
			trackEvent( `${ viewContext }_adsense-abr`, 'setup_final_step' );
		}
	}, [ createMessageCTAClicked, viewContext ] );

	const handleSecondaryCTAClick = () => {
		trackEvent(
			`${ viewContext }_adsense-abr`,
			'create_message',
			'secondary_cta'
		);
	};

	return (
		<Fragment>
			<p>
				{ __(
					'Create and publish an ad blocking recovery message in AdSense.',
					'google-site-kit'
				) }
			</p>
			<p>
				{ __(
					'Site visitors will be given the option to allow ads on your site. You can also present them with other options to fund your site (optional)',
					'google-site-kit'
				) }
			</p>
			{ saveSettingsError && <ErrorNotice error={ saveSettingsError } /> }
			<div className="googlesitekit-ad-blocking-recovery__create-message-footer">
				<div className="googlesitekit-ad-blocking-recovery__create-message-footer-actions">
					{ createMessageCTAClicked ? (
						<Fragment>
							<SpinnerButton
								onClick={ onCTAClick }
								isSaving={ isSaving }
								disabled={ isSaving }
							>
								{ __(
									'My message is ready',
									'google-site-kit'
								) }
							</SpinnerButton>
							<Link
								onClick={ handleSecondaryCTAClick }
								href={ privacyMessagingURL }
								external
								hideExternalIndicator
							>
								{ __( 'Create message', 'google-site-kit' ) }
							</Link>
						</Fragment>
					) : (
						<Button
							href={ privacyMessagingURL }
							target="_blank"
							onClick={ onCTAClick }
						>
							{ __( 'Create message', 'google-site-kit' ) }
						</Button>
					) }
				</div>
				{ createMessageCTAClicked && (
					<p className="googlesitekit-ad-blocking-recovery__create-message-footer-note">
						{ __(
							'Ad blocking recovery only works if you’ve created and published your message in AdSense',
							'google-site-kit'
						) }
					</p>
				) }
			</div>
		</Fragment>
	);
}
