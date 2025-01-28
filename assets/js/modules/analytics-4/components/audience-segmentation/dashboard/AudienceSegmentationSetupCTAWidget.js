/**
 * AudienceSegmentationSetupCTAWidget component.
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
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import whenActive from '../../../../../util/when-active';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';
import { AUDIENCE_SEGMENTATION_SETUP_FORM } from '../../../datastore/constants';
import { SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION } from '../settings/SettingsCardVisitorGroups/SetupSuccess';
import useViewContext from '../../../../../hooks/useViewContext';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../../components/AdminMenuTooltip';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { trackEvent, WEEK_IN_SECONDS } from '../../../../../util';
import useEnableAudienceGroup from '../../../hooks/useEnableAudienceGroup';
import AudienceErrorModal from './AudienceErrorModal';
import NotificationWithSVG from '../../../../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import ActionsCTALinkDismiss from '../../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import BannerGraphicsSVGDesktop from '../../../../../../svg/graphics/audience-segmentation-setup-desktop.svg';
import BannerGraphicsSVGTablet from '../../../../../../svg/graphics/audience-segmentation-setup-tablet.svg';
import BannerGraphicsSVGMobile from '../../../../../../svg/graphics/audience-segmentation-setup-mobile.svg';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import { AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION } from './AudienceSegmentationSetupSuccessSubtleNotification';

export const AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION =
	'audience_segmentation_setup_cta-notification';

const breakpointSVGMap = {
	[ BREAKPOINT_SMALL ]: BannerGraphicsSVGMobile,
	[ BREAKPOINT_TABLET ]: BannerGraphicsSVGTablet,
};
function AudienceSegmentationSetupCTAWidget( { id, Notification } ) {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();
	const trackEventCategory = `${ viewContext }_audiences-setup-cta-dashboard`;

	const { stackNotification } = useDispatch( CORE_NOTIFICATIONS );

	const { setValues } = useDispatch( CORE_FORMS );

	const showTooltip = useShowTooltip( id );
	const { isTooltipVisible } = useTooltipState( id );

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	const isCTADismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed( id )
	);
	const dismissedPromptsLoaded = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getDismissedPrompts', [] )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			'autoSubmit'
		)
	);

	const [ showErrorModal, setShowErrorModal ] = useState( false );

	const { dismissItem, dismissPrompt } = useDispatch( CORE_USER );

	const { apiErrors, failedAudiences, isSaving, onEnableGroups } =
		useEnableAudienceGroup( {
			onSuccess: () => {
				stackNotification(
					AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION
				);
				dismissPrompt( id, {
					expiresInSeconds: 0,
				} );
				// Dismiss success notification in settings.
				dismissItem(
					SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION
				);
			},
			onError: () => {
				setShowErrorModal( true );
			},
		} );

	const { clearPermissionScopeError } = useDispatch( CORE_USER );
	const { setSetupErrorCode } = useDispatch( CORE_SITE );

	const onCancel = useCallback( () => {
		setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
			autoSubmit: false,
		} );
		clearPermissionScopeError();
		setSetupErrorCode( null );
		setShowErrorModal( false );
	}, [ clearPermissionScopeError, setSetupErrorCode, setValues ] );

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';

	useEffect( () => {
		if ( isTooltipVisible ) {
			trackEvent( trackEventCategory, 'tooltip_view' );
		}
	}, [ isTooltipVisible, trackEventCategory ] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
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
					onDismiss={ () => {
						trackEvent( trackEventCategory, 'tooltip_dismiss' );
					} }
					tooltipStateKey={ id }
				/>
			</Fragment>
		);
	}

	const hideCTABanner =
		( isCTADismissed || ! dismissedPromptsLoaded ) && ! isSaving;

	// TODO: Don't use `skipHidingFromQueue` and remove the need to check
	// if this component should output anything.
	//
	// We "incorrectly" pass true to the `skipHidingFromQueue` option when dismissing this banner.
	// This is because we don't want the component removed from the DOM as we have to still render
	// the `AdminMenuTooltip` in this component. This means that we have to rely on manually
	// checking for the dismissal state here.
	if ( hideCTABanner && ! hasOAuthError && ! showErrorModal ) {
		return null;
	}

	const gaTrackingProps = {
		gaTrackingEventArgs: {
			category: trackEventCategory,
		},
	};

	return (
		<Fragment>
			<Notification { ...gaTrackingProps }>
				<NotificationWithSVG
					id={ id }
					title={ __(
						'Learn how different types of visitors interact with your site',
						'google-site-kit'
					) }
					description={
						<p>
							{ __(
								'Understand what brings new visitors to your site and keeps them coming back. Site Kit can now group your site visitors into relevant segments like “new“ and “returning“. To set up these new groups, Site Kit needs to update your Google Analytics property.',
								'google-site-kit'
							) }
						</p>
					}
					actions={
						<ActionsCTALinkDismiss
							id={ id }
							className="googlesitekit-setup-cta-banner__actions-wrapper"
							ctaLabel={
								isSaving
									? __( 'Enabling groups', 'google-site-kit' )
									: __( 'Enable groups', 'google-site-kit' )
							}
							onCTAClick={ onEnableGroups }
							dismissOnCTAClick={ false }
							dismissLabel={
								isDismissalFinal
									? __(
											'Don’t show again',
											'google-site-kit'
									  )
									: __( 'Maybe later', 'google-site-kit' )
							}
							onDismiss={ showTooltip }
							dismissOptions={ {
								skipHidingFromQueue: true,
							} }
							dismissExpires={ 2 * WEEK_IN_SECONDS }
							{ ...gaTrackingProps }
						/>
					}
					SVG={
						breakpointSVGMap[ breakpoint ] ??
						BannerGraphicsSVGDesktop
					}
					primaryCellSizes={ {
						lg: 7,
						md: 8,
					} }
					SVGCellSizes={ {
						lg: 5,
					} }
				/>
			</Notification>
			{ ( showErrorModal || hasOAuthError ) && (
				<AudienceErrorModal
					hasOAuthError={ hasOAuthError }
					apiErrors={ apiErrors.length ? apiErrors : failedAudiences }
					onRetry={ onEnableGroups }
					inProgress={ isSaving }
					onCancel={
						hasOAuthError
							? onCancel
							: () => setShowErrorModal( false )
					}
					trackEventCategory={ `${ viewContext }_audiences-setup` }
				/>
			) }
		</Fragment>
	);
}

AudienceSegmentationSetupCTAWidget.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};

export default compose(
	whenActive( { moduleName: 'analytics-4' } ),
	withWidgetComponentProps( 'audienceSegmentationSetupCTA' )
)( AudienceSegmentationSetupCTAWidget );
