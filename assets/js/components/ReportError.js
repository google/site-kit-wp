/**
 * ReportError component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { isInsufficientPermissionsError } from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
import ErrorText from '../components/ErrorText';
import CTA from '../components/notifications/cta';

const { useSelect } = Data;

export default function ReportError( { moduleSlug, error } ) {
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) );

	/* translators: %s: module name */
	let title = sprintf( __( 'Data error in %s', 'google-site-kit' ), module?.name );
	let message = error.message;

	if ( isInsufficientPermissionsError( error ) ) {
		/* translators: %s: module name */
		title = sprintf( __( 'Insufficient permissions in %s', 'google-site-kit' ), module?.name );
		message = getInsufficientPermissionsErrorDescription( message, module );
	}

	const reconnectURL = error?.data?.reconnectURL;
	const description = reconnectURL ? <ErrorText message={ message } reconnectURL={ reconnectURL } /> : message;

	return <CTA title={ title } description={ description } error />;
}

ReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.object.isRequired,
};
