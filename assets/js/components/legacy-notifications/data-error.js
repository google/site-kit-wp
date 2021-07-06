/**
 * `getDataErrorComponent` function.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useEffectOnce } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { getModulesData } from '../../util';
import { isInsufficientPermissionsError } from '../../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../../util/insufficient-permissions-error-description';
import ErrorText from '../ErrorText';
import CTA from './cta';
import ctaWrapper from './cta-wrapper';
const { useSelect, useDispatch } = Data;

/**
 * Creates a CTA component when there's a data error. Different wrapper HTML is needed depending on where the CTA gets output, which is determined by the inGrid, fullWidth, and createGrid parameters.
 *
 * @since 1.0.0
 *
 * @param {string}  moduleSlug   Module slug.
 * @param {string}  errorMessage Description of error.
 * @param {boolean} inGrid       Creates layout to fit within an existing grid with 'cell' classes. Default is half-width grid cells. Default: false.
 * @param {boolean} fullWidth    Creates layout with 'cell--span-12' to be full width. Default: false.
 * @param {boolean} createGrid   Adds a full grid layout with padding. Default: false.
 * @param {Object}  errorObj     Error related data.
 * @return {WPElement} CTA component with data error message.
 */
function getDataErrorComponent( moduleSlug, errorMessage, inGrid = false, fullWidth = false, createGrid = false, errorObj = {} ) {
	const modulesData = getModulesData();
	const module = modulesData[ moduleSlug ];

	/* translators: %s: module name */
	let title = sprintf( __( 'Data error in %s', 'google-site-kit' ), module?.name );
	let message = errorMessage;

	if ( isInsufficientPermissionsError( errorObj ) ) {
		/* translators: %s: module name */
		title = sprintf( __( 'Insufficient permissions in %s', 'google-site-kit' ), module?.name );
		message = getInsufficientPermissionsErrorDescription( message, module );
	}

	const reconnectURL = errorObj?.data?.reconnectURL;
	const description = reconnectURL ? <ErrorText message={ message } reconnectURL={ reconnectURL } /> : message;

	let cta = <CTA title={ title } description={ description } error />;

	// This is to handle token expired error specifically.
	if ( 'Invalid Credentials' === errorMessage ) {
		const CTAWithErrorEffect = () => {
			const connectURL = useSelect( ( select ) => select( CORE_USER ).getConnectURL() );
			const { setInternalServerError } = useDispatch( CORE_SITE );
			useEffectOnce( () => {
				setInternalServerError( {
					id: 'token-notification',
					title: __( 'Security Token Error', 'google-site-kit' ),
					description: __( 'We’re unable to retrieve your data because your security token is expired or revoked.', 'google-site-kit' ),
					learnMoreURL: connectURL,
					learnMoreLabel: __( 'Please reauthenticate your account', 'google-site-kit' ),
				} );
			} );

			return cta;
		};

		cta = <CTAWithErrorEffect />;
	}

	return ctaWrapper( cta, inGrid, fullWidth, createGrid );
}

export default getDataErrorComponent;
