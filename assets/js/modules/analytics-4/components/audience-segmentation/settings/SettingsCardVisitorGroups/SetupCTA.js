/**
 * SettingsCardVisitorGroups SetupCTA component.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '../../../../../../googlesitekit/notifications/datastore/constants';
import { AUDIENCE_SEGMENTATION_SETUP_FORM } from '../../../../datastore/constants';
import { AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION } from '../../dashboard/AudienceSegmentationSetupSuccessSubtleNotification';
import Link from '../../../../../../components/Link';
import { AudienceErrorModal } from '../../dashboard';
import useEnableAudienceGroup from '../../../../hooks/useEnableAudienceGroup';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';

export default function SetupCTA() {
	const viewContext = useViewContext();

	const [ showErrorModal, setShowErrorModal ] = useState( false );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const { apiErrors, failedAudiences, isSaving, onEnableGroups } =
		useEnableAudienceGroup( {
			redirectURL: global.location.href,
			onSuccess: () => {
				// Dismiss success notification in dashboard.
				dismissNotification(
					AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION
				);
			},
			onError: () => {
				setShowErrorModal( true );
			},
		} );

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			'autoSubmit'
		)
	);

	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';

	const { setValues } = useDispatch( CORE_FORMS );
	const { setSetupErrorCode } = useDispatch( CORE_SITE );
	const { clearPermissionScopeError } = useDispatch( CORE_USER );

	function handleEnableGroups() {
		trackEvent(
			`${ viewContext }_audiences-setup-cta-settings`,
			'enable_groups'
		).finally( onEnableGroups );
	}

	const onCancel = () => {
		setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
			autoSubmit: false,
		} );
		clearPermissionScopeError();
		setSetupErrorCode( null );
		setShowErrorModal( false );
	};

	return (
		<div className="googlesitekit-settings-visitor-groups__setup">
			<p>
				{ __(
					'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property.',
					'google-site-kit'
				) }
			</p>
			{ isSaving && (
				<div className="googlesitekit-settings-visitor-groups__setup-progress">
					<p>{ __( 'Enabling groups', 'google-site-kit' ) }</p>
					<ProgressBar compress />
				</div>
			) }
			{ ! isSaving && (
				<Link onClick={ handleEnableGroups }>
					{ __( 'Enable groups', 'google-site-kit' ) }
				</Link>
			) }
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
				/>
			) }
		</div>
	);
}
