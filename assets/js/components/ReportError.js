/**
 * ReportError component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { isInsufficientPermissionsError } from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
import { purify } from '../util/purify';
import ErrorText from '../components/ErrorText';
import CTA from './notifications/CTA';

const { useSelect, useDispatch } = Data;

export default function ReportError( { moduleSlug, error } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const dispatch = useDispatch();

	let title = sprintf(
		/* translators: %s: module name */
		__( 'Data error in %s', 'google-site-kit' ),
		module?.name
	);
	let message = error.message;

	if ( isInsufficientPermissionsError( error ) ) {
		title = sprintf(
			/* translators: %s: module name */
			__( 'Insufficient permissions in %s', 'google-site-kit' ),
			module?.name
		);
		message = getInsufficientPermissionsErrorDescription( message, module );
	}

	const reconnectURL = error?.data?.reconnectURL;
	const description = reconnectURL ? (
		<ErrorText message={ message } reconnectURL={ reconnectURL } />
	) : (
		purify.sanitize( message, { ALLOWED_TAGS: [] } )
	);

	const retry = !! error?.selectorData;

	const handleRetry = useCallback( () => {
		if ( retry ) {
			const { selectorData } = error;
			dispatch( selectorData.storeName ).invalidateResolution(
				selectorData.name,
				selectorData.args
			);
		}
	}, [ dispatch, error, retry ] );

	return (
		<CTA
			title={ title }
			description={ description }
			onRetry={ retry ? handleRetry : undefined }
			retry={ retry }
			error
		/>
	);
}

ReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.object.isRequired,
};
