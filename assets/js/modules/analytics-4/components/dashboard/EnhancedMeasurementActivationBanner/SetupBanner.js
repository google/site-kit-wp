/**
 * EnhancedMeasurementActivationBanner > SetupBanner component.
 *
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '../../../../analytics/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import {
	DAY_IN_SECONDS,
	getTimeInSeconds,
	trackEvent,
} from '../../../../../util';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import ErrorNotice from '../../../../../components/ErrorNotice';
import SurveyViewTrigger from '../../../../../components/surveys/SurveyViewTrigger';
import useViewContext from '../../../../../hooks/useViewContext';

const { useDispatch, useSelect } = Data;

export default function SetupBanner( props ) {
	const {
		children,
		errorNotice,
		isDismissed,
		isSaving,
		onDismiss,
		onSubmit,
	} = props;

	const viewContext = useViewContext();

	// The `enhanced_measurement` query value is arbitrary and serves two purposes:
	// 1. To ensure that `authentication_success` isn't appended when returning from OAuth.
	// 2. To guarantee it doesn't match any existing notifications in the `BannerNotifications` component, thus preventing any unintended displays.
	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'enhanced_measurement',
	} );

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		const OAuthURL = select( CORE_USER ).getConnectURL( {
			additionalScopes: [ EDIT_SCOPE ],
			redirectURL,
		} );

		if ( ! OAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );

	const handleSubmitChanges = useCallback( async () => {
		const scopes = [];

		if ( hasEditScope === false ) {
			scopes.push( EDIT_SCOPE );
		}

		// If scope not granted, trigger scope error right away. These are
		// typically handled automatically based on API responses, but
		// this particular case has some special handling to improve UX.
		if ( scopes.length > 0 ) {
			setValues( FORM_SETUP, { autoSubmit: true } );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to enable enhanced measurement for the selected web data stream.',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes,
					skipModal: true,
					redirectURL,
				},
			} );
			return;
		}

		await onSubmit();
	}, [
		hasEditScope,
		onSubmit,
		redirectURL,
		setPermissionScopeError,
		setValues,
	] );

	const handleDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-notification`,
			'dismiss_notification'
		);

		onDismiss?.();
	}, [ onDismiss, viewContext ] );

	const handleLearnMore = useCallback( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-notification`,
			'click_learn_more_link'
		);
	}, [ viewContext ] );

	useEffect( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-notification`,
			'view_notification'
		);
	}, [ viewContext ] );

	const description = hasEditScope
		? __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required.',
				'google-site-kit'
		  )
		: __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required — you’ll be redirected to give permission for Site Kit to enable it on your behalf.',
				'google-site-kit'
		  );

	return (
		<BannerNotification
			id="googlesitekit-enhanced-measurement-activation-banner"
			className="googlesitekit-enhanced-measurement-setup-banner"
			title={ __(
				'Understand how visitors interact with your content',
				'google-site-kit'
			) }
			description={ description }
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ documentationURL }
			onLearnMoreClick={ handleLearnMore }
			ctaComponent={
				<SpinnerButton
					onClick={ handleSubmitChanges }
					isSaving={ isSaving || isNavigatingToOAuthURL }
				>
					{ __( 'Enable now', 'google-site-kit' ) }
				</SpinnerButton>
			}
			footer={
				<p className="googlesitekit-enhanced-measurement-setup-banner__footer-notice">
					{ __(
						'You can always add/edit this in the Site Kit Settings',
						'google-site-kit'
					) }
				</p>
			}
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			format="small"
			// Although the banner does handle its own dismiss state via a dismissable item, we still need to
			// provide a value here to ensure BannerNotification's own dismiss state is expired.
			dismissExpires={ getTimeInSeconds( 'month' ) }
			onDismiss={ handleDismiss }
		>
			{ errorNotice && <ErrorNotice error={ errorNotice } /> }
			{ ! isDismissed && (
				<SurveyViewTrigger
					triggerID="view_enhanced_measurement_cta"
					ttl={ DAY_IN_SECONDS }
				/>
			) }
			{ children }
		</BannerNotification>
	);
}

SetupBanner.propTypes = {
	onSubmitSuccess: PropTypes.func,
	onDismiss: PropTypes.func,
	children: PropTypes.node,
};
