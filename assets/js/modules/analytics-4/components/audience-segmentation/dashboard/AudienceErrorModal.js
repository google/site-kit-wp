/**
 * Audience Segmentation AudienceErrorModal component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../../../../../components/Link';
import ModalDialog from '../../../../../components/ModalDialog';
import Portal from '../../../../../components/Portal';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { isInsufficientPermissionsError } from '../../../../../util/errors';
import { trackEvent } from '../../../../../util';

export default function AudienceErrorModal( {
	apiErrors,
	hasOAuthError,
	inProgress,
	title,
	description,
	trackEventCategory,
	onCancel = () => {},
	onRetry = () => {},
} ) {
	const errors = Array.isArray( apiErrors ) ? apiErrors : [ apiErrors ];

	const helpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: 'analytics-4_insufficient_permissions',
		} )
	);

	const requestAccessURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getServiceEntityAccessURL()
	);

	const errorTroubleshootingLinkURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: 'access_denied',
		} )
	);

	if ( ! errors.length && ! hasOAuthError ) {
		return null;
	}

	const hasInsufficientPermissionsError = errors.some( ( error ) =>
		isInsufficientPermissionsError( error )
	);

	let errorTitle, errorDescription, confirmButton, buttonLink;

	if ( hasOAuthError ) {
		errorTitle = __( 'Analytics update failed', 'google-site-kit' );
		errorDescription = createInterpolateElement(
			__(
				'Setup was interrupted because you did not grant the necessary permissions. <HelpLink />',
				'google-site-kit'
			),
			{
				HelpLink: (
					<Link
						href={ errorTroubleshootingLinkURL }
						external
						hideExternalIndicator
					>
						{ __( 'Get help', 'google-site-kit' ) }
					</Link>
				),
			}
		);
		confirmButton = __( 'Retry', 'google-site-kit' );
	} else if ( hasInsufficientPermissionsError ) {
		errorTitle = __( 'Insufficient permissions', 'google-site-kit' );
		errorDescription = createInterpolateElement(
			__(
				'You’ll need to contact your administrator. Trouble getting access? <HelpLink />',
				'google-site-kit'
			),
			{
				HelpLink: (
					<Link href={ helpLink } external hideExternalIndicator>
						{ __( 'Get help', 'google-site-kit' ) }
					</Link>
				),
			}
		);
		confirmButton = __( 'Request access', 'google-site-kit' );
		buttonLink = requestAccessURL;
	} else {
		errorTitle =
			title || __( 'Failed to set up visitor groups', 'google-site-kit' );
		errorDescription =
			description ||
			__(
				'Oops! Something went wrong. Retry enabling groups.',
				'google-site-kit'
			);
		confirmButton = __( 'Retry', 'google-site-kit' );
	}

	return (
		<Portal>
			<ModalDialog
				dialogActive
				buttonLink={ buttonLink }
				title={ errorTitle }
				subtitle={ errorDescription }
				handleConfirm={ onRetry }
				confirmButton={ confirmButton }
				handleDialog={ onCancel }
				onOpen={ () => {
					let action;

					if ( hasOAuthError ) {
						action = 'auth_error';
					} else if ( hasInsufficientPermissionsError ) {
						action = 'insufficient_permissions_error';
					} else {
						action = 'setup_error';
					}

					trackEvent( trackEventCategory, action );
				} }
				onClose={ onCancel }
				danger
				inProgress={ inProgress }
			/>
		</Portal>
	);
}

AudienceErrorModal.propTypes = {
	apiErrors: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
		PropTypes.array,
	] ),
	hasOAuthError: PropTypes.bool,
	inProgress: PropTypes.bool,
	title: PropTypes.string,
	description: PropTypes.string,
	trackEventCategory: PropTypes.string,
	onCancel: PropTypes.func,
	onRetry: PropTypes.func,
};
