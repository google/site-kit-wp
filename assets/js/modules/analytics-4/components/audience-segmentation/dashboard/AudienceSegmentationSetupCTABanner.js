/**
 * AudienceSegmentationSetupCTABanner component.
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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_GROUPS,
} from '../../../../../googlesitekit/notifications/datastore/constants';
import { AUDIENCE_SEGMENTATION_SETUP_FORM } from '../../../../../modules/analytics-4/datastore/constants';
import { SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION } from '../../../../../modules/analytics-4/components/audience-segmentation/settings/SettingsCardVisitorGroups/SetupSuccess';
import useViewContext from '../../../../../hooks/useViewContext';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip';
import { WEEK_IN_SECONDS } from '../../../../../util';
import useEnableAudienceGroup from '../../../../../modules/analytics-4/hooks/useEnableAudienceGroup';
import AudienceErrorModal from '../../../../../modules/analytics-4/components/audience-segmentation/dashboard/AudienceErrorModal';
import SetupCTA from '../../../../../googlesitekit/notifications/components/layout/SetupCTA';
/* eslint-disable import/no-unresolved */
import BannerSVGDesktop from '../../../../../../svg/graphics/banner-audience-segmentation-setup-cta.svg?url';
import BannerSVGMobile from '../../../../../../svg/graphics/banner-audience-segmentation-setup-cta-mobile.svg?url';
/* eslint-enable import/no-unresolved */

export const AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION =
	'audience_segmentation_setup_cta-notification';

function AudienceSegmentationSetupCTABanner( { id, Notification } ) {
	const viewContext = useViewContext();
	const trackEventCategory = `${ viewContext }_audiences-setup-cta-dashboard`;

	const { invalidateResolution, dismissNotification } =
		useDispatch( CORE_NOTIFICATIONS );

	const { setValues } = useDispatch( CORE_FORMS );

	const tooltipSettings = {
		tooltipSlug: id,
		title: __(
			'You can always enable groups in Settings later',
			'google-site-kit'
		),
		content: __(
			'The visitors group section will be added to your dashboard once you set it up.',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			'autoSubmit'
		)
	);

	const [ showErrorModal, setShowErrorModal ] = useState( false );

	const { dismissItem } = useDispatch( CORE_USER );

	const onSuccess = useCallback( () => {
		invalidateResolution( 'getQueuedNotifications', [
			viewContext,
			NOTIFICATION_GROUPS.DEFAULT,
		] );
		dismissNotification( id );
		// Dismiss success notification in settings.
		dismissItem( SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION );
	}, [
		dismissItem,
		id,
		invalidateResolution,
		dismissNotification,
		viewContext,
	] );

	const onError = useCallback( () => {
		setShowErrorModal( true );
	}, [ setShowErrorModal ] );

	const { apiErrors, failedAudiences, isSaving, onEnableGroups } =
		useEnableAudienceGroup( {
			onSuccess,
			onError,
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

	const gaTrackingProps = {
		gaTrackingEventArgs: {
			category: trackEventCategory,
		},
	};

	return (
		<Fragment>
			<Notification { ...gaTrackingProps }>
				<SetupCTA
					notificationID={ id }
					title={ __(
						'Learn how different types of visitors interact with your site',
						'google-site-kit'
					) }
					description={ __(
						'Understand what brings new visitors to your site and keeps them coming back. Site Kit can now group your site visitors into relevant segments like "new" and "returning". To set up these new groups, Site Kit needs to update your Google Analytics property.',
						'google-site-kit'
					) }
					ctaButton={ {
						label: isSaving
							? __( 'Enabling groups', 'google-site-kit' )
							: __( 'Enable groups', 'google-site-kit' ),
						onClick: onEnableGroups,
						disabled: isSaving,
					} }
					dismissButton={ {
						label: isDismissalFinal
							? __( "Don't show again", 'google-site-kit' )
							: __( 'Maybe later', 'google-site-kit' ),
						onClick: showTooltip,
						disabled: isSaving,
					} }
					dismissOptions={ {
						skipHidingFromQueue: true,
						expiresInSeconds: isDismissalFinal
							? 0
							: 2 * WEEK_IN_SECONDS,
					} }
					svg={ {
						desktop: BannerSVGDesktop,
						mobile: BannerSVGMobile,
						verticalPosition: 'bottom',
					} }
					gaTrackingEventArgs={ {
						category: trackEventCategory,
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

AudienceSegmentationSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};

export default AudienceSegmentationSetupCTABanner;
