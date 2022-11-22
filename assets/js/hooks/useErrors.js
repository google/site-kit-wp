/**
 * External dependencies
 */
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
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import Link from '../components/Link';

const { useSelect, useDispatch } = Data;

export function useErrors( moduleSlug, error ) {
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

	const showRetry = !! retryableErrors.length;

	const errorTroubleshootingLinkURL = useSelect( ( select ) => {
		const err = {
			...( showRetry ? retryableErrors[ 0 ] : errors[ 0 ] ),
		};

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

		if ( err?.code === 'internal_server_error' ) {
			return __(
				'There was a critical error on this website while fetching data',
				'google-site-kit'
			);
		}

		if ( err?.code === 'invalid_json' ) {
			return __(
				'The server provided an invalid response.',
				'google-site-kit'
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

	const requestAccesElement = (
		<Fragment>
			{ showRequestAccessURL && (
				<Button href={ requestAccessURL } target="_blank">
					{ __( 'Request access', 'google-site-kit' ) }
				</Button>
			) }
		</Fragment>
	);

	const retryElement = (
		<Fragment>
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
		</Fragment>
	);

	return {
		title,
		description,
		retryElement,
		requestAccesElement,
	};
}
