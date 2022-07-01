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
import uniqWith from 'lodash/uniqWith';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import {
	isAuthError,
	isInsufficientPermissionsError,
	isPermissionScopeError,
} from '../util/errors';
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
	let title;

	const getMessage = ( e ) => {
		const message = e.message;

		if ( isInsufficientPermissionsError( e ) ) {
			title = sprintf(
				/* translators: %s: module name */
				__( 'Insufficient permissions in %s', 'google-site-kit' ),
				module?.name
			);
			return getInsufficientPermissionsErrorDescription(
				message,
				module
			);
		}

		return message;
	};

	const errors = Array.isArray( error ) ? error : [ error ];
	const uniqueErrors = uniqWith(
		errors.map( ( e ) => ( {
			...e,
			message: getMessage( e ),
			reconnectURL: e.data?.reconnectURL,
		} ) ),
		( errorA, errorB ) =>
			errorA.message === errorB.message &&
			errorA.reconnectURL === errorB.reconnectURL
	);

	const hasInsufficientPermissionsError = errors.some( ( e ) =>
		isInsufficientPermissionsError( e )
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
			{ uniqueErrors.map( ( e ) => {
				const reconnectURL = error?.data?.reconnectURL;
				return reconnectURL ? (
					<ErrorText
						key={ e.message }
						message={ e.message }
						reconnectURL={ reconnectURL }
					/>
				) : (
					<p key={ e.message }>
						{ purify.sanitize( e.message, { ALLOWED_TAGS: [] } ) }
					</p>
				);
			} ) }
		</Fragment>
	);

	const retryableErrors = errors.filter(
		( e ) =>
			!! e?.selectorData?.storeName &&
			e.selectorData?.name === 'getReport' &&
			! isInsufficientPermissionsError( e ) &&
			! isPermissionScopeError( e ) &&
			! isAuthError( e )
	);
	const showRetry = !! retryableErrors.length;

	const handleRetry = useCallback( () => {
		retryableErrors.forEach( ( e ) => {
			const { selectorData } = e;
			dispatch( selectorData.storeName ).invalidateResolution(
				selectorData.name,
				selectorData.args
			);
		} );
	}, [ dispatch, retryableErrors ] );

	return (
		<CTA
			title={ title }
			description={ description }
			ctaType={ showRetry ? 'button' : undefined }
			ctaLabel={
				showRetry ? __( 'Retry', 'google-site-kit' ) : undefined
			}
			onClick={ showRetry ? handleRetry : undefined }
			error
		/>
	);
}

ReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
};
