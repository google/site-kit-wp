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
import { uniqWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import {
	isInsufficientPermissionsError,
	getReportErrorMessage,
} from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
import { purify } from '../util/purify';
import ErrorText from '../components/ErrorText';
import CTA from './notifications/CTA';
import ReportErrorActions from './ReportErrorActions';
import useViewOnly from '../hooks/useViewOnly';
const { useSelect } = Data;

export default function ReportError( { moduleSlug, error } ) {
	const isViewOnly = useViewOnly();
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const errors = Array.isArray( error ) ? error : [ error ];

	let title;

	const getMessage = ( err ) => {
		if ( isInsufficientPermissionsError( err ) ) {
			if ( isViewOnly ) {
				title = sprintf(
					/* translators: %s: module name */
					__( 'Access lost to %s', 'google-site-kit' ),
					module?.name
				);

				return sprintf(
					/* translators: %s: module name */
					__(
						'The administrator sharing this module with you has lost access to the %s service, so you won’t be able to see stats from it on the Site Kit dashboard. You can contact them or another administrator to restore access.',
						'google-site-kit'
					),
					module?.name
				);
			}

			title = sprintf(
				/* translators: %s: module name */
				__( 'Insufficient permissions in %s', 'google-site-kit' ),
				module?.name
			);

			return getInsufficientPermissionsErrorDescription(
				err.message,
				module
			);
		}

		return getReportErrorMessage( err );
	};

	const uniqueErrors = uniqWith(
		errors.map( ( err ) => ( {
			...err,
			message: getMessage( err ),
			reconnectURL: err.data?.reconnectURL,
		} ) ),
		( errorA, errorB ) =>
			errorA.message === errorB.message &&
			errorA.reconnectURL === errorB.reconnectURL
	);

	const hasInsufficientPermissionsError = errors.some( ( err ) =>
		isInsufficientPermissionsError( err )
	);

	if ( ! hasInsufficientPermissionsError && uniqueErrors.length === 1 ) {
		title = sprintf(
			/* translators: %s: module name */
			__( 'Data error in %s', 'google-site-kit' ),
			module?.name
		);
	} else if ( ! hasInsufficientPermissionsError && uniqueErrors.length > 1 ) {
		title = sprintf(
			/* translators: %s: module name */
			__( 'Data errors in %s', 'google-site-kit' ),
			module?.name
		);
	}

	const description = (
		<Fragment>
			{ uniqueErrors.map( ( err ) => {
				const reconnectURL = error?.data?.reconnectURL;
				return reconnectURL ? (
					<ErrorText
						key={ err.message }
						message={ err.message }
						reconnectURL={ reconnectURL }
					/>
				) : (
					<p key={ err.message }>
						{ purify.sanitize( err.message, { ALLOWED_TAGS: [] } ) }
					</p>
				);
			} ) }
		</Fragment>
	);

	return (
		<CTA title={ title } description={ description } error>
			<ReportErrorActions moduleSlug={ moduleSlug } error={ error } />
		</CTA>
	);
}

ReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
};
