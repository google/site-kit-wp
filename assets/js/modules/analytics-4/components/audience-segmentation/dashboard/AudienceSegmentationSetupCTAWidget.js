/**
 * KeyMetricsSetupCTAWidget component.
 *
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

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import BannerGraphicsSVGDesktop from '../../../../../../svg/graphics/audience-segmentation-setup-desktop.svg';
import BannerGraphicsSVGTablet from '../../../../../../svg/graphics/audience-segmentation-setup-tablet.svg';
import BannerGraphicsSVGMobile from '../../../../../../svg/graphics/audience-segmentation-setup-mobile.svg';
import whenActive from '../../../../../util/when-active';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	EDIT_SCOPE,
	AUDIENCE_SEGMENTATION_SETUP_FORM,
} from '../../../datastore/constants';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../../components/AdminMenuTooltip';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { WEEK_IN_SECONDS } from '../../../../../util';
import AudienceErrorModal from './AudienceErrorModal';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';

export const AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION =
	'audience_segmentation_setup_cta-notification';

function AudienceSegmentationSetupCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const showTooltip = useShowTooltip(
		AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
	);
	const { isTooltipVisible } = useTooltipState(
		AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
		)
	);
	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
		)
	);

	const { enableAudienceGroup } = useDispatch( MODULES_ANALYTICS_4 );

	const configuredAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);

	const hasAnalytics4EditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			'autoSubmit'
		)
	);

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'audience_segmentation',
	} );

	const [ apiErrors, setApiErrors ] = useState( [] );
	const [ failedAudiences, setFailedAudiences ] = useState( [] );
	const onEnableGroups = useCallback(
		async ( retryFailedAudiences ) => {
			setIsSaving( true );

			// If scope not granted, trigger scope error right away. These are
			// typically handled automatically based on API responses, but
			// this particular case has some special handling to improve UX.
			if ( ! hasAnalytics4EditScope ) {
				setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
					autoSubmit: true,
				} );

				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create new audiences in Analytics.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						skipDefaultErrorNotifications: true,
						redirectURL,
					},
				} );

				setIsSaving( false );
				return;
			}

			setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
				autoSubmit: false,
			} );

			const { error, failedSiteKitAudienceResourceNames } =
				await enableAudienceGroup( {
					failedSiteKitAudienceResourceNames: retryFailedAudiences,
				} );

			if ( error ) {
				setApiErrors( [ error ] );
			}

			if ( failedSiteKitAudienceResourceNames ) {
				setFailedAudiences( failedSiteKitAudienceResourceNames );
			}

			setIsSaving( false );
		},
		[
			enableAudienceGroup,
			hasAnalytics4EditScope,
			setPermissionScopeError,
			redirectURL,
			setValues,
		]
	);

	// If the user ends up back on this component with the required scope granted,
	// and already submitted the form, trigger the submit again.
	useEffect( () => {
		if ( hasAnalytics4EditScope && autoSubmit ) {
			onEnableGroups();
		}
	}, [ hasAnalytics4EditScope, autoSubmit, onEnableGroups ] );

	const analyticsIsDataAvailableOnLoad = useSelect( ( select ) => {
		// We should call isGatheringData() within this component for completeness
		// as we do not want to rely on it being called in other components.
		// This selector makes report requests which, if they return data, then the
		// `data-available` transients are set. These transients are prefetched as
		// a global on the next page load.
		select( MODULES_ANALYTICS_4 ).isGatheringData();
		return select( MODULES_ANALYTICS_4 ).isDataAvailableOnLoad();
	} );

	const { dismissPrompt } = useDispatch( CORE_USER );
	const handleDismissClick = async () => {
		showTooltip();

		// For the first dismissal, we show the notification again in two weeks.
		if ( dismissCount < 1 ) {
			const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
			await dismissPrompt( AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION, {
				expiresInSeconds: twoWeeksInSeconds,
			} );
		} else {
			// For the second dismissal, dismiss the notification permanently.
			await dismissPrompt( AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION );
		}
	};

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const hasOAuthError = autoSubmit && setupErrorCode;

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<AdminMenuTooltip
					title={ __(
						'You can always enable groups from Settings later',
						'google-site-kit'
					) }
					content={ __(
						'The visitors group section will be added to your dashboard once you set it up.',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={
						AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
					}
				/>
			</Fragment>
		);
	}

	if (
		configuredAudiences === undefined ||
		configuredAudiences?.length ||
		! analyticsIsDataAvailableOnLoad ||
		isDismissed
	) {
		return null;
	}

	if ( hasOAuthError ) {
		return (
			<AudienceErrorModal
				hasOAuthError
				onRetry={ onEnableGroups }
				inProgress={ isSaving }
			/>
		);
	}

	if ( apiErrors.length ) {
		return (
			<AudienceErrorModal
				apiErrors={ apiErrors }
				onRetry={ onEnableGroups }
				inProgress={ isSaving }
			/>
		);
	}

	if ( failedAudiences.length ) {
		return (
			<AudienceErrorModal
				apiErrors={ apiErrors }
				onRetry={ () => onEnableGroups( failedAudiences ) }
				inProgress={ isSaving }
			/>
		);
	}

	// TODO: We need to refactor this and the ConsentModeSetupCTAWidget to avoid this duplicate inlining of the widget context and area structure,
	// and to ensure only one of these setup CTAs is shown at a time. This will be handled in a subsequent issue.
	return (
		<div className="googlesitekit-widget-context">
			<Grid className="googlesitekit-widget-area">
				<Row>
					<Cell size={ 12 }>
						<Widget
							noPadding
							className="googlesitekit-audience-segmentation-setup-cta-widget"
						>
							<Grid collapsed>
								<Row>
									<Cell
										smSize={ 6 }
										mdSize={ 8 }
										lgSize={ 7 }
										className="googlesitekit-widget-audience-segmentation-primary-cell"
									>
										<div className="googlesitekit-widget-audience-segmentation-text__wrapper">
											<h3 className="googlesitekit-publisher-win__title">
												{ __(
													'Learn how different types of visitors interact with your site',
													'google-site-kit'
												) }
											</h3>
											<p>
												{ __(
													'Understand what brings new visitors to your site and keeps them coming back. Site Kit can now group your site visitors into relevant segments like "new" and "returning". To set up these new groups, Site Kit needs to update your Google Analytics property.',
													'google-site-kit'
												) }
											</p>
										</div>
										<div className="googlesitekit-widget-audience-segmentation-actions__wrapper">
											<Fragment>
												<SpinnerButton
													className="googlesitekit-audience-segmentation-cta-button"
													onClick={ onEnableGroups }
													isSaving={ isSaving }
												>
													{ isSaving
														? __(
																'Enabling groups',
																'google-site-kit'
														  )
														: __(
																'Enable groups',
																'google-site-kit'
														  ) }
												</SpinnerButton>
												<Button
													tertiary
													onClick={
														handleDismissClick
													}
												>
													{ dismissCount < 1
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
									</Cell>
									{ ! isMobileBreakpoint &&
										! isTabletBreakpoint && (
											<Cell
												alignBottom
												className="googlesitekit-widget-audience-segmentation-svg__wrapper"
												smSize={ 6 }
												mdSize={ 3 }
												lgSize={ 5 }
											>
												<BannerGraphicsSVGDesktop />
											</Cell>
										) }
									{ isTabletBreakpoint && (
										<Cell
											className="googlesitekit-widget-audience-segmentation-svg__wrapper"
											mdSize={ 8 }
										>
											<BannerGraphicsSVGTablet />
										</Cell>
									) }
									{ isMobileBreakpoint && (
										<Cell
											className="googlesitekit-widget-audience-segmentation-svg__wrapper"
											smSize={ 8 }
										>
											<BannerGraphicsSVGMobile />
										</Cell>
									) }
								</Row>
							</Grid>
						</Widget>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

AudienceSegmentationSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default compose(
	whenActive( { moduleName: 'analytics-4' } ),
	withWidgetComponentProps( 'audienceSegmentationSetupCTA' )
)( AudienceSegmentationSetupCTAWidget );
