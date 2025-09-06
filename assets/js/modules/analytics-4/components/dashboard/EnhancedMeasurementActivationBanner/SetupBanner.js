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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import { DAY_IN_SECONDS } from '@/js/util';
import { NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';
import SetupCTA from '@/js/googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVG from '@/svg/graphics/banner-enhanced-measurement-setup-cta.svg?url';
import BannerMobileSVG from '@/svg/graphics/banner-enhanced-measurement-setup-cta-mobile.svg?url';

export default function SetupBanner( props ) {
	const { id, Notification, errorNotice, isSaving, onDismiss, onSubmit } =
		props;

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
	const { pinNotification } = useDispatch( CORE_NOTIFICATIONS );

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

			await pinNotification( id, NOTIFICATION_GROUPS.SETUP_CTAS );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to enable enhanced measurement for the selected web data stream',
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
		id,
		onSubmit,
		pinNotification,
		redirectURL,
		setPermissionScopeError,
		setValues,
	] );

	const isUsingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const { triggerSurvey } = useDispatch( CORE_USER );

	const handleView = useCallback( () => {
		if ( isUsingProxy ) {
			triggerSurvey( 'view_enhanced_measurement_cta', {
				ttl: DAY_IN_SECONDS,
			} );
		}
	}, [ triggerSurvey, isUsingProxy ] );

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
		<Notification onView={ handleView }>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Understand how visitors interact with your content',
					'google-site-kit'
				) }
				description={ description }
				errorText={ errorNotice?.message }
				learnMoreLink={ {
					href: documentationURL,
				} }
				ctaButton={ {
					label: __( 'Enable now', 'google-site-kit' ),
					onClick: handleSubmitChanges,
					disabled: isSaving || isNavigatingToOAuthURL,
					inProgress: isSaving || isNavigatingToOAuthURL,
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: onDismiss,
					disabled: isSaving || isNavigatingToOAuthURL,
				} }
				helpText={ __(
					'You can always add/edit this in the Site Kit Settings',
					'google-site-kit'
				) }
				svg={ {
					desktop: BannerSVG,
					mobile: BannerMobileSVG,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
}

SetupBanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType,
	errorNotice: PropTypes.object,
	isSaving: PropTypes.bool,
	onSubmit: PropTypes.func,
	onDismiss: PropTypes.func,
};
