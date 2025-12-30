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
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { AUDIENCE_SEGMENTATION_SETUP_FORM } from '@/js/modules/analytics-4/datastore/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION } from './SetupSuccess';
import Link from '@/js/components/Link';
import P from '@/js/components/Typography/P';
import { AudienceErrorModal } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard';
import useEnableAudienceGroup from '@/js/modules/analytics-4/hooks/useEnableAudienceGroup';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import useFormValue from '@/js/hooks/useFormValue';

export default function SetupCTA() {
	const viewContext = useViewContext();

	const [ showErrorModal, setShowErrorModal ] = useState( false );

	const learnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'visitor-groups' )
	);

	const onError = useCallback( () => {
		setShowErrorModal( true );
	}, [ setShowErrorModal ] );

	const { setValue } = useDispatch( CORE_UI );

	const { apiErrors, failedAudiences, isSaving, onEnableGroups } =
		useEnableAudienceGroup( {
			redirectURL: global.location.href,
			onSuccess: () => {
				setValue(
					SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION,
					true
				);
			},
			onError,
		} );

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const autoSubmit = useFormValue(
		AUDIENCE_SEGMENTATION_SETUP_FORM,
		'autoSubmit'
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

	function onCancel() {
		setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
			autoSubmit: false,
		} );
		clearPermissionScopeError();
		setSetupErrorCode( null );
		setShowErrorModal( false );
	}

	return (
		<div className="googlesitekit-settings-visitor-groups__setup">
			<P>
				{ createInterpolateElement(
					__(
						'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: <Link href={ learnMoreLink } external />,
					}
				) }
			</P>
			{ isSaving && (
				<div className="googlesitekit-settings-visitor-groups__setup-progress">
					<P>{ __( 'Enabling groups', 'google-site-kit' ) }</P>
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
