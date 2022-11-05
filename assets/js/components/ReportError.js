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
import memize from 'memize';
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
import { Button } from 'googlesitekit-components';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import {
	isErrorRetryable,
	isInsufficientPermissionsError,
} from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
import { purify } from '../util/purify';
import ErrorText from '../components/ErrorText';
import CTA from './notifications/CTA';
import Link from './Link';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

const { useSelect, useDispatch } = Data;

export default function ReportError( { moduleSlug, error } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( moduleSlug )
	);
	const requestAccessURL = useSelect( ( select ) =>
		typeof select( storeName )?.getServiceEntityAccessURL === 'function'
			? select( storeName ).getServiceEntityAccessURL()
			: null
	);

	const errors = Array.isArray( error ) ? error : [ error ];

	const retryableErrors = errors.filter(
		( err ) =>
			isErrorRetryable( err, err.selectorData ) &&
			err.selectorData.name === 'getReport'
	);

	const determineError = memize( ( errorsA, errorsB ) => {
		return {
			...( errorsA.length ? errorsA[ 0 ] : errorsB[ 0 ] ),
		};
	} );

	const showRetry = !! retryableErrors.length;

	const errorTroubleshootingLinkURL = useSelect( ( select ) => {
		const err = determineError( retryableErrors, errors );

		if ( isInsufficientPermissionsError( err ) ) {
			err.code = `${ moduleSlug }_insufficient_permissions`;
		}

		return select( CORE_SITE ).getErrorTroubleshootingLinkURL( err );
	} );

	const dispatch = useDispatch();

	let title;

	const getMessage = ( err ) => {
		if ( isInsufficientPermissionsError( err ) ) {
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

		return err.message;
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

	const handleRetry = useCallback( () => {
		retryableErrors.forEach( ( err ) => {
			const { selectorData } = err;
			dispatch( selectorData.storeName ).invalidateResolution(
				selectorData.name,
				selectorData.args
			);
		} );
	}, [ dispatch, retryableErrors ] );

	const showRequestAccessURL =
		requestAccessURL && hasInsufficientPermissionsError;

	return (
		<CTA title={ title } description={ description } error>
			<div className="googlesitekit-error-cta-wrapper">
				{ showRequestAccessURL && (
					<Button href={ requestAccessURL } target="_blank">
						{ __( 'Request access', 'google-site-kit' ) }
					</Button>
				) }
				{ showRetry ? (
					<Fragment>
						<Button onClick={ handleRetry }>
							{ __( 'Retry', 'google-site-kit' ) }
						</Button>
						<span className="googlesitekit-error-retry-text">
							{ __( 'Retry didn’t work?', 'google-site-kit' ) }{ ' ' }
						</span>
						<Link href={ errorTroubleshootingLinkURL } external>
							{ __( 'Get help', 'google-site-kit' ) }
						</Link>
					</Fragment>
				) : (
					<Link href={ errorTroubleshootingLinkURL } external>
						{ __( 'Get help', 'google-site-kit' ) }
					</Link>
				) }
			</div>
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
