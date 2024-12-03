/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Fragment,
	createInterpolateElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import { Cell, Grid, Row } from '../../material-components';
import BannerGraphicsSVG from '../../../svg/graphics/consent-mode-setup.svg';
import BannerGraphicsTabletSVG from '../../../svg/graphics/consent-mode-setup-tablet.svg';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../AdminMenuTooltip';
import ErrorText from '../ErrorText';
import Link from '../Link';
import useViewContext from '../../hooks/useViewContext';
import useViewOnly from '../../hooks/useViewOnly';
import { DAY_IN_SECONDS, WEEK_IN_SECONDS, trackEvent } from '../../util';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '../../hooks/useBreakpoint';

function ConsentModeSetupCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState( null );

	const breakpoint = useBreakpoint();

	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();

	const isConsentModeEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConsentModeEnabled()
	);

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const showTooltip = useShowTooltip( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
	const { isTooltipVisible } = useTooltipState(
		CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
		)
	);
	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
		)
	);

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { setConsentModeEnabled, saveConsentModeSettings } =
		useDispatch( CORE_SITE );
	const { dismissPrompt, triggerSurvey } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const trackingRef = useRef();

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	const shouldShowWidget = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return false;
		}

		if ( isSaving ) {
			return true;
		}

		if ( isDismissed !== false || isConsentModeEnabled !== false ) {
			return false;
		}

		return select( CORE_SITE ).isAdsConnected();
	} );

	useEffect( () => {
		if ( inView && ! hasBeenInView && shouldShowWidget ) {
			trackEvent(
				`${ viewContext }_CoMo-ads-setup-notification`,
				'view_notification'
			);

			if ( usingProxy ) {
				triggerSurvey( 'view_como_setup_cta', { ttl: DAY_IN_SECONDS } );
			}

			setHasBeenInView( true );
		}
	}, [
		hasBeenInView,
		inView,
		shouldShowWidget,
		triggerSurvey,
		usingProxy,
		viewContext,
	] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable consent mode from Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG }
				/>
			</Fragment>
		);
	}

	if ( ! shouldShowWidget ) {
		return <WidgetNull />;
	}

	const handleCTAClick = async () => {
		setSaveError( null );
		setIsSaving( true );

		setConsentModeEnabled( true );

		const promises = [
			saveConsentModeSettings(),
			trackEvent(
				`${ viewContext }_CoMo-ads-setup-notification`,
				'confirm_notification'
			),
		];

		if ( usingProxy ) {
			promises.push(
				triggerSurvey( 'enable_como', { ttl: DAY_IN_SECONDS } )
			);
		}

		const [ { error } ] = await Promise.all( promises );

		if ( error ) {
			setSaveError( error );
			setConsentModeEnabled( false );
			setIsSaving( false );
		} else {
			await dismissPrompt( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
			navigateTo( `${ settingsURL }#/admin-settings` );
		}
	};

	const handleDismissClick = async () => {
		trackEvent(
			`${ viewContext }_CoMo-ads-setup-notification`,
			'dismiss_notification'
		);

		showTooltip();

		// For the first two dismissals, we show the notification again in two weeks.
		if ( dismissCount < 2 ) {
			const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
			await dismissPrompt( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG, {
				expiresInSeconds: twoWeeksInSeconds,
			} );
		} else {
			// For the third dismissal, dismiss permanently.
			await dismissPrompt( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
		}
	};

	return (
		<div className="googlesitekit-widget-context">
			<Grid className="googlesitekit-widget-area">
				<Row>
					<Cell size={ 12 }>
						<Widget
							noPadding
							className="googlesitekit-setup-cta-banner googlesitekit-consent-mode-setup-cta-widget"
						>
							<div
								ref={ trackingRef }
								className="googlesitekit-setup-cta-banner__cells"
							>
								<div className="googlesitekit-setup-cta-banner__primary-cell">
									<h3 className="googlesitekit-setup-cta-banner__title">
										{ __(
											'Enable Consent Mode to preserve tracking for your Ads campaigns',
											'google-site-kit'
										) }
									</h3>
									<div className="googlesitekit-setup-cta-banner__description">
										<p>
											{ createInterpolateElement(
												__(
													'Consent mode interacts with your Consent Management Platform (CMP) or custom implementation for obtaining visitor consent, such as a cookie consent banner. <a>Learn more</a>',
													'google-site-kit'
												),
												{
													a: (
														<Link
															href={
																consentModeDocumentationURL
															}
															external
															aria-label={ __(
																'Learn more about consent mode',
																'google-site-kit'
															) }
														/>
													),
												}
											) }
										</p>
									</div>

									{ saveError && (
										<ErrorText
											message={ saveError.message }
										/>
									) }
									<div className="googlesitekit-setup-cta-banner__actions-wrapper">
										<Fragment>
											<SpinnerButton
												onClick={ handleCTAClick }
												isSaving={ isSaving }
											>
												{ __(
													'Enable consent mode',
													'google-site-kit'
												) }
											</SpinnerButton>
											<Button
												tertiary
												onClick={ handleDismissClick }
											>
												{ dismissCount < 2
													? __(
															'Maybe later',
															'google-site-kit'
													  )
													: __(
															'Don’t show again',
															'google-site-kit'
													  ) }
											</Button>
										</Fragment>
									</div>
								</div>
								<div className="googlesitekit-setup-cta-banner__svg-wrapper">
									{ breakpoint !== BREAKPOINT_SMALL &&
									breakpoint !== BREAKPOINT_XLARGE ? (
										<BannerGraphicsTabletSVG />
									) : (
										<BannerGraphicsSVG />
									) }
								</div>
							</div>
						</Widget>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

ConsentModeSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default withWidgetComponentProps( 'consent-mode-setup-cta' )(
	ConsentModeSetupCTAWidget
);
