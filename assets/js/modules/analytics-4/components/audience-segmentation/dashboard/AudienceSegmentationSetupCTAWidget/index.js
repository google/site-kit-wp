/**
 * AudienceSegmentationSetupCTAWidget component.
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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import whenActive from '../../../../../../util/when-active';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_NOTIFICATIONS } from '../../../../../../googlesitekit/notifications/datastore/constants';
import {
	MODULES_ANALYTICS_4,
	AUDIENCE_SEGMENTATION_SETUP_FORM,
} from '../../../../datastore/constants';
import { SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION } from '../../settings/SettingsCardVisitorGroups/SetupSuccess';
import useViewContext from '../../../../../../hooks/useViewContext';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../../../components/AdminMenuTooltip';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { trackEvent, WEEK_IN_SECONDS } from '../../../../../../util';
import withIntersectionObserver from '../../../../../../util/withIntersectionObserver';
import useEnableAudienceGroup from '../../../../hooks/useEnableAudienceGroup';
import AudienceErrorModal from '../AudienceErrorModal';
import SetupCTAContent from './SetupCTAContent';

export const AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION =
	'audience_segmentation_setup_cta-notification';

const SetupCTAContentWithIntersectionObserver =
	withIntersectionObserver( SetupCTAContent );

function AudienceSegmentationSetupCTAWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();

	const { invalidateResolution } = useDispatch( CORE_NOTIFICATIONS );

	const { setValues } = useDispatch( CORE_FORMS );

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

	const dismissedPromptsLoaded = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getDismissedPrompts', [] )
	);

	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
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
				invalidateResolution( 'getQueuedNotifications', [
					viewContext,
				] );
				dismissPrompt( AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION, {
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

	const analyticsIsDataAvailableOnLoad = useSelect( ( select ) => {
		// We should call isGatheringData() within this component for completeness
		// as we do not want to rely on it being called in other components.
		// This selector makes report requests which, if they return data, then the
		// `data-available` transients are set. These transients are prefetched as
		// a global on the next page load.
		select( MODULES_ANALYTICS_4 ).isGatheringData();
		return select( MODULES_ANALYTICS_4 ).isDataAvailableOnLoad();
	} );

	const audienceSegmentationSetupCompletedBy = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAudienceSegmentationSetupCompletedBy()
	);

	function handleDismissClick() {
		showTooltip();

		trackEvent(
			`${ viewContext }_audiences-setup-cta-dashboard`,
			'dismiss_notification'
		).finally( async () => {
			// For the first dismissal, we show the notification again in two weeks.
			if ( dismissCount < 1 ) {
				const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
				await dismissPrompt(
					AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
					{
						expiresInSeconds: twoWeeksInSeconds,
					}
				);
			} else {
				// For the second dismissal, dismiss the notification permanently.
				await dismissPrompt(
					AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
				);
			}
		} );
	}

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
			trackEvent(
				`${ viewContext }_audiences-setup-cta-dashboard`,
				'tooltip_view'
			);
		}
	}, [ isTooltipVisible, viewContext ] );

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
					onDismiss={ () => {
						trackEvent(
							`${ viewContext }_audiences-setup-cta-dashboard`,
							'tooltip_dismiss'
						);
					} }
					tooltipStateKey={
						AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
					}
				/>
			</Fragment>
		);
	}

	if (
		audienceSegmentationSetupCompletedBy !== null ||
		configuredAudiences === undefined ||
		configuredAudiences?.length ||
		! analyticsIsDataAvailableOnLoad ||
		isDismissed ||
		! dismissedPromptsLoaded
	) {
		return null;
	}

	function handleEnableGroups() {
		trackEvent(
			`${ viewContext }_audiences-setup-cta-dashboard`,
			'confirm_notification'
		).finally( onEnableGroups );
	}

	return (
		<Fragment>
			<SetupCTAContentWithIntersectionObserver
				Widget={ Widget }
				onEnableGroups={ handleEnableGroups }
				isSaving={ isSaving }
				dismissCount={ dismissCount }
				handleDismissClick={ handleDismissClick }
				onInView={ () => {
					trackEvent(
						`${ viewContext }_audiences-setup-cta-dashboard`,
						'view_notification'
					);
				} }
			/>
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
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default compose(
	whenActive( { moduleName: 'analytics-4' } ),
	withWidgetComponentProps( 'audienceSegmentationSetupCTA' )
)( AudienceSegmentationSetupCTAWidget );
