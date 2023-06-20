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
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../../../../../components/Header';
import HelpMenu from '../../../../../components/help/HelpMenu';
import Layout from '../../../../../components/layout/Layout';
import { Cell, Grid, Row } from '../../../../../material-components';
import PageHeader from '../../../../../components/PageHeader';
import AdBlockingSetupSVG from '../../../../../../svg/graphics/ad-blocking-recovery-setup.svg';
import Link from '../../../../../components/Link';
import Stepper from '../../../../../components/Stepper';
import Step from '../../../../../components/Stepper/Step';
import PlaceTagsStep from './steps/PlaceTagsStep';
import CreateMessageStep from './steps/CreateMessageStep';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import {
	AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
	AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED,
	AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED,
	MODULES_ADSENSE,
} from '../../../datastore/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export default function AdBlockingRecoveryApp() {
	const breakpoint = useBreakpoint();

	const settingsURL = useSelect(
		( select ) =>
			`${ select( CORE_SITE ).getAdminURL(
				'googlesitekit-settings'
			) }#/connected-services/adsense`
	);
	const initialActiveStep = useSelect( ( select ) => {
		const adBlockingRecoverySetupStatus =
			select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus();

		switch ( adBlockingRecoverySetupStatus ) {
			case '':
				return 0;
			case AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED:
				return 1;
			case AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED:
				return 2;
		}
	} );
	const createMessageCTAClicked = useSelect(
		( select ) =>
			!! select( CORE_UI ).getValue(
				AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED
			)
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const {
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockerDetectionSnippet,
		setUseAdBlockerDetectionErrorSnippet,
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
		setUseAdBlockerDetectionSnippet( false );
		setUseAdBlockerDetectionErrorSnippet( false );

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
		setUseAdBlockerDetectionErrorSnippet,
		setUseAdBlockerDetectionSnippet,
		settingsURL,
	] );

	useEffect( () => {
		if ( undefined === activeStep && undefined !== initialActiveStep ) {
			setActiveStep( initialActiveStep );
		}
	}, [ activeStep, initialActiveStep ] );

	const isTabletWidthOrLarger = breakpoint !== BREAKPOINT_SMALL;

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			<div className="googlesitekit-ad-blocking-recovery googlesitekit-module-page">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<Grid>
									<Row>
										<Cell
											lgSize={ 6 }
											mdSize={ 8 }
											smSize={ 4 }
										>
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

								<Grid className="googlesitekit-ad-blocking-recovery__content">
									<Row>
										<Cell mdSize={ 6 } lgSize={ 8 }>
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
													<PlaceTagsStep
														setActiveStep={
															setActiveStep
														}
													/>
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
										</Cell>

										{ isTabletWidthOrLarger && (
											<Cell
												className="googlesitekit-ad-blocking-recovery__hero-graphic"
												mdSize={ 2 }
												lgSize={ 4 }
											>
												<AdBlockingSetupSVG />
											</Cell>
										) }
									</Row>
								</Grid>

								<div className="googlesitekit-ad-blocking-recovery__footer googlesitekit-ad-blocking-recovery__buttons">
									<div className="googlesitekit-ad-blocking-recovery__footer-cancel">
										<Link onClick={ onCancel }>
											{ __(
												'Cancel',
												'google-site-kit'
											) }
										</Link>
									</div>
								</div>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
