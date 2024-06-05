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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import Link from '../../../../../components/Link';
import PageHeader from '../../../../../components/PageHeader';
import Stepper from '../../../../../components/Stepper';
import Step from '../../../../../components/Stepper/Step';
import Layout from '../../../../../components/layout/Layout';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import useViewContext from '../../../../../hooks/useViewContext';
import { Cell, Grid, Row } from '../../../../../material-components';
import { trackEvent } from '../../../../../util';
import {
	AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP,
	MODULES_ADSENSE,
} from '../../../datastore/constants';
import Content from './Content';
import CreateMessageStep from './steps/CreateMessageStep';
import PlaceTagsStep from './steps/PlaceTagsStep';

const { useSelect, useDispatch } = Data;

export default function SetupMain() {
	const viewContext = useViewContext();

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const adSenseSettingsURL = `${ settingsURL }#/connected-services/adsense`;
	const createMessageCTAClicked = useSelect(
		( select ) =>
			!! select( CORE_UI ).getValue(
				AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED
			)
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const initialActiveStep = useSelect( ( select ) => {
		const statusStepMap = {
			[ ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED ]:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.CREATE_MESSAGE,
			[ ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED ]:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.COMPLETE,
		};

		const adBlockingRecoverySetupStatus =
			select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus();

		if ( adBlockingRecoverySetupStatus === undefined ) {
			return undefined;
		}

		return (
			statusStepMap[ adBlockingRecoverySetupStatus ] ||
			ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.PLACE_TAGS
		);
	} );

	const setupSuccessURL = addQueryArgs( dashboardURL, {
		notification: 'ad_blocking_recovery_setup_success',
	} );
	const adsenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ adsenseAccountID }/privacymessaging/ad_blocking`,
		} )
	);

	const {
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockingRecoverySnippet,
		setUseAdBlockingRecoveryErrorSnippet,
	} = useDispatch( MODULES_ADSENSE );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const [ activeStep, setActiveStep ] = useState( initialActiveStep );

	const onCancel = useCallback( async () => {
		if ( activeStep === 0 ) {
			await trackEvent(
				`${ viewContext }_adsense-abr`,
				'cancel_setup',
				'on_place_tag_step'
			);

			if ( document.referrer.includes( settingsURL ) ) {
				return navigateTo( adSenseSettingsURL );
			}

			return navigateTo( dashboardURL );
		}

		if ( createMessageCTAClicked ) {
			await trackEvent(
				`${ viewContext }_adsense-abr`,
				'cancel_setup',
				'on_final_step'
			);
			return navigateTo( adSenseSettingsURL );
		}

		setAdBlockingRecoverySetupStatus( '' );
		setUseAdBlockingRecoverySnippet( false );
		setUseAdBlockingRecoveryErrorSnippet( false );

		const { error } = await saveSettings();

		await trackEvent(
			`${ viewContext }_adsense-abr`,
			'cancel_setup',
			'on_create_message_step'
		);

		if ( ! error ) {
			if ( document.referrer.includes( settingsURL ) ) {
				navigateTo( adSenseSettingsURL );
			} else {
				navigateTo( dashboardURL );
			}
		}
	}, [
		activeStep,
		adSenseSettingsURL,
		createMessageCTAClicked,
		dashboardURL,
		navigateTo,
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockingRecoveryErrorSnippet,
		setUseAdBlockingRecoverySnippet,
		settingsURL,
		viewContext,
	] );

	useEffect( () => {
		if ( undefined === activeStep && undefined !== initialActiveStep ) {
			setActiveStep( initialActiveStep );
		}
	}, [ activeStep, initialActiveStep ] );

	return (
		<Layout rounded>
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
						<PageHeader
							className="googlesitekit-heading-3 googlesitekit-ad-blocking-recovery__heading"
							title={ __(
								'Ad Blocking Recovery',
								'google-site-kit'
							) }
							fullWidth
						/>
					</Cell>
				</Row>
			</Grid>

			<Content>
				<Stepper
					activeStep={ activeStep }
					className="googlesitekit-ad-blocking-recovery__steps"
				>
					<Step
						title={ __(
							'Enable ad blocking recovery message (required)',
							'google-site-kit'
						) }
						className="googlesitekit-ad-blocking-recovery__step googlesitekit-ad-blocking-recovery__step-place-tags"
					>
						<PlaceTagsStep setActiveStep={ setActiveStep } />
					</Step>
					<Step
						title={ __(
							'Create your site’s ad blocking recovery message (required)',
							'google-site-kit'
						) }
						className="googlesitekit-ad-blocking-recovery__step googlesitekit-ad-blocking-recovery__step-create-message"
					>
						<CreateMessageStep />
					</Step>
				</Stepper>
				{ ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.COMPLETE ===
					activeStep && (
					<div className="googlesitekit-ad-blocking-recovery__complete-content">
						<p>
							{ __(
								'Create and publish an ad blocking recovery message in AdSense',
								'google-site-kit'
							) }
						</p>
						<p>
							{ __(
								'Site visitors will be given the option to allow ads on your site. You can also present them with other options to fund your site (optional)',
								'google-site-kit'
							) }
						</p>
					</div>
				) }
			</Content>

			<div className="googlesitekit-ad-blocking-recovery__footer googlesitekit-ad-blocking-recovery__buttons">
				<div className="googlesitekit-ad-blocking-recovery__footer-cancel">
					{ ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.COMPLETE ===
					activeStep ? (
						<div className="googlesitekit-ad-blocking-recovery__complete-actions">
							<SpinnerButton href={ setupSuccessURL }>
								{ __(
									'My message is ready',
									'google-site-kit'
								) }
							</SpinnerButton>
							<Link
								href={ privacyMessagingURL }
								external
								hideExternalIndicator
							>
								{ __( 'Create my message', 'google-site-kit' ) }
							</Link>
						</div>
					) : (
						<Link onClick={ onCancel }>
							{ __( 'Cancel', 'google-site-kit' ) }
						</Link>
					) }
				</div>
			</div>
		</Layout>
	);
}
