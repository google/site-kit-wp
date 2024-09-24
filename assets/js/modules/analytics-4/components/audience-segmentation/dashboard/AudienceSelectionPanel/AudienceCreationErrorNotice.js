/**
 * Audience Segmentation AudienceCreationErrorNotice component.
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
import { Button } from 'googlesitekit-components';
import Link from '../../../../../../components/Link';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { isInsufficientPermissionsError } from '../../../../../../util/errors';
import WarningSVG from '../../../../../../../svg/icons/warning.svg';

export default function AudienceCreationErrorNotice( {
	apiErrors,
	hasOAuthError,
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

	let errorTitle, errorDescription;

	if ( hasOAuthError ) {
		errorDescription = createInterpolateElement(
			__(
				'Setup was interrupted because you didn’t grant the necessary permissions. Click on Create again to retry. If that doesn’t work, <HelpLink />',
				'google-site-kit'
			),
			{
				HelpLink: (
					<Link
						href={ errorTroubleshootingLinkURL }
						external
						hideExternalIndicator
					>
						{ __( 'get help', 'google-site-kit' ) }
					</Link>
				),
			}
		);
	} else if ( hasInsufficientPermissionsError ) {
		errorTitle = __( 'Insufficient permissions', 'google-site-kit' );
		errorDescription = createInterpolateElement(
			__(
				'Contact your administrator. Trouble getting access? <HelpLink />',
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
	} else {
		errorTitle = __( 'Analytics update failed', 'google-site-kit' );
		errorDescription = __(
			'Click on Create to try again.',
			'google-site-kit'
		);
	}

	return (
		<div className="googlesitekit-audience-creation-error-notice">
			<WarningSVG width={ 24 } height={ 24 } />
			<div className="googlesitekit-audience-creation-error-notice__content">
				{ errorTitle && (
					<p className="googlesitekit-audience-creation-error-notice__title">
						{ errorTitle }
					</p>
				) }
				<p className="googlesitekit-audience-creation-error-notice__description">
					{ errorDescription }
				</p>
			</div>
			{ hasInsufficientPermissionsError && (
				<div className="googlesitekit-audience-creation-error-notice__actions">
					<Button href={ requestAccessURL } target="_blank" danger>
						{ __( 'Request access', 'google-site-kit' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

AudienceCreationErrorNotice.propTypes = {
	apiErrors: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
		PropTypes.array,
	] ),
	hasOAuthError: PropTypes.bool,
};
