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
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Layout from '../../../../../components/layout/Layout';
import { Cell, Grid, Row } from '../../../../../material-components';
import Content from './Content';
import PlaceTagsStep from './steps/PlaceTagsStep';
import CreateMessageStep from './steps/CreateMessageStep';
import Link from '../../../../../components/Link';
import Stepper from '../../../../../components/Stepper';
import Step from '../../../../../components/Stepper/Step';
import PageHeader from '../../../../../components/PageHeader';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import {
	AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP,
	MODULES_ADSENSE,
} from '../../../datastore/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export default function SetupMain() {
	const settingsURL = useSelect(
		( select ) =>
			`${ select( CORE_SITE ).getAdminURL(
				'googlesitekit-settings'
			) }#/connected-services/adsense`
	);
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
			return navigateTo( dashboardURL );
		}

		if ( createMessageCTAClicked ) {
			return navigateTo( settingsURL );
		}

		setAdBlockingRecoverySetupStatus( '' );
		setUseAdBlockingRecoverySnippet( false );
		setUseAdBlockingRecoveryErrorSnippet( false );

		const { error } = await saveSettings();

		if ( ! error ) {
			navigateTo( dashboardURL );
		}
	}, [
		activeStep,
		createMessageCTAClicked,
		dashboardURL,
		navigateTo,
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockingRecoveryErrorSnippet,
		setUseAdBlockingRecoverySnippet,
		settingsURL,
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
							'Place the standard ad blocking recovery tag (required)',
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
			</Content>

			<div className="googlesitekit-ad-blocking-recovery__footer googlesitekit-ad-blocking-recovery__buttons">
				<div className="googlesitekit-ad-blocking-recovery__footer-cancel">
					<Link onClick={ onCancel }>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
				</div>
			</div>
		</Layout>
	);
}
