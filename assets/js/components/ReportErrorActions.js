/**
 * ReportErrorActions component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import {
	isErrorRetryable,
	isInsufficientPermissionsError,
} from '../util/errors';
import useViewOnly from '../hooks/useViewOnly';
import Link from './Link';

export default function ReportErrorActions( props ) {
	const {
		moduleSlug,
		error,
		GetHelpLink,
		hideGetHelpLink,
		buttonVariant,
		onRetry,
		onRequestAccess,
		getHelpClassName,
		RequestAccessButton,
		RetryButton,
	} = props;

	const isViewOnly = useViewOnly();
	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( moduleSlug )
	);
	const requestAccessURL = useSelect( ( select ) =>
		typeof select( storeName )?.getServiceEntityAccessURL === 'function'
			? select( storeName ).getServiceEntityAccessURL()
			: null
	);

	const errors = Array.isArray( error ) ? error : [ error ];

	const errorsWithSelectorData = useSelect( ( select ) =>
		errors.map( ( err ) => {
			const selectorData =
				select( storeName )?.getSelectorDataForError( err );

			return {
				...err,
				selectorData,
			};
		} )
	);

	const retryableErrors = errorsWithSelectorData?.filter(
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

	const hasInsufficientPermissionsError = errors.some( ( err ) =>
		isInsufficientPermissionsError( err )
	);

	const handleRetry = useCallback( () => {
		retryableErrors.forEach( ( err ) => {
			const { selectorData } = err;
			dispatch( selectorData.storeName ).invalidateResolution(
				selectorData.name,
				selectorData.args
			);
		} );

		onRetry?.();
	}, [ dispatch, retryableErrors, onRetry ] );

	const showRequestAccessURL =
		requestAccessURL && hasInsufficientPermissionsError && ! isViewOnly;

	return (
		<div className="googlesitekit-report-error-actions">
			{ showRequestAccessURL &&
				( typeof RequestAccessButton === 'function' ? (
					<RequestAccessButton
						requestAccessURL={ requestAccessURL }
					/>
				) : (
					<Button
						onClick={ onRequestAccess }
						href={ requestAccessURL }
						target="_blank"
						danger={ buttonVariant === 'danger' }
						tertiary={ buttonVariant === 'tertiary' }
					>
						{ __( 'Request access', 'google-site-kit' ) }
					</Button>
				) ) }
			{ showRetry && (
				<Fragment>
					{ typeof RetryButton === 'function' ? (
						<RetryButton handleRetry={ handleRetry } />
					) : (
						<Button
							onClick={ handleRetry }
							danger={ buttonVariant === 'danger' }
							tertiary={ buttonVariant === 'tertiary' }
						>
							{ __( 'Retry', 'google-site-kit' ) }
						</Button>
					) }
					{ ! hideGetHelpLink && (
						<span className="googlesitekit-error-retry-text">
							{ createInterpolateElement(
								__(
									'Retry didn’t work? <HelpLink />',
									'google-site-kit'
								),
								{
									HelpLink: (
										<Link
											href={ errorTroubleshootingLinkURL }
											external
											hideExternalIndicator
										>
											{ __(
												'Get help',
												'google-site-kit'
											) }
										</Link>
									),
								}
							) }
						</span>
					) }
				</Fragment>
			) }
			{ ! showRetry && ! hideGetHelpLink && (
				<div className={ getHelpClassName }>
					{ typeof GetHelpLink === 'function' ? (
						<GetHelpLink linkURL={ errorTroubleshootingLinkURL } />
					) : (
						<Link
							href={ errorTroubleshootingLinkURL }
							external
							hideExternalIndicator
						>
							{ __( 'Get help', 'google-site-kit' ) }
						</Link>
					) }
				</div>
			) }
		</div>
	);
}

ReportErrorActions.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
	GetHelpLink: PropTypes.elementType,
	hideGetHelpLink: PropTypes.bool,
	buttonVariant: PropTypes.string,
	onRetry: PropTypes.func,
	onRequestAccess: PropTypes.func,
	getHelpClassName: PropTypes.string,
	RequestAccessButton: PropTypes.elementType,
	RetryButton: PropTypes.elementType,
};
