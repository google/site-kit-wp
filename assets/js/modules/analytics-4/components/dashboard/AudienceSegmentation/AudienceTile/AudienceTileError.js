/**
 * AudienceTileError component.
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
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Fragment,
	createInterpolateElement,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	isErrorRetryable,
	isInsufficientPermissionsError,
} from '../../../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceTileErrorImage from '../../../../../../../svg/graphics/analytics-audience-segmentation-tile-error.svg';
import Button from '../../../../../../googlesitekit/components-gm2/Button';
import Link from '../../../../../../components/Link';

export default function AudienceTileError( { errors } ) {
	const hasInsufficientPermissionsError = errors.some( ( err ) =>
		isInsufficientPermissionsError( err )
	);

	const requestAccessURL = useSelect( ( select ) =>
		typeof select( MODULES_ANALYTICS_4 )?.getServiceEntityAccessURL ===
		'function'
			? select( MODULES_ANALYTICS_4 ).getServiceEntityAccessURL()
			: null
	);

	const errorsWithSelectorData = useSelect( ( select ) =>
		errors.map( ( err ) => {
			const selectorData =
				select( MODULES_ANALYTICS_4 )?.getSelectorDataForError( err );

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

	const dispatch = useDispatch();

	const handleRetry = useCallback( () => {
		retryableErrors.forEach( ( err ) => {
			const { selectorData } = err;
			dispatch( selectorData.storeName ).invalidateResolution(
				selectorData.name,
				selectorData.args
			);
		} );
	}, [ dispatch, retryableErrors ] );

	return (
		<div className="googlesitekit-audience-segmentation-tile-error">
			<div className="googlesitekit-audience-segmentation-tile-error__container">
				<AudienceTileErrorImage className="googlesitekit-audience-segmentation-tile-error__image" />
				<div className="googlesitekit-audience-segmentation-tile-error__body">
					<div className="googlesitekit-audience-segmentation-tile-error__message">
						<h3 className="googlesitekit-audience-segmentation-tile-error__title">
							{ hasInsufficientPermissionsError
								? __(
										'Insufficient permissions',
										'google-site-kit'
								  )
								: __(
										'Data loading failed',
										'google-site-kit'
								  ) }
						</h3>
						{ hasInsufficientPermissionsError && (
							<p className="googlesitekit-audience-segmentation-tile-error__explanation">
								{ __(
									"You'll need to contact your administrator.",
									'google-site-kit'
								) }
								<br />
								{ createInterpolateElement(
									__(
										'Trouble getting access? <HelpLink />',
										'google-site-kit'
									),
									{
										HelpLink: (
											<Link
												href="https://sitekit.withgoogle.com/documentation/troubleshooting/analytics/#insufficient-permissions"
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
							</p>
						) }
					</div>
					<div className="googlesitekit-audience-segmentation-tile-error__cta">
						{ hasInsufficientPermissionsError ? (
							<Fragment>
								<Button
									href={ requestAccessURL }
									target="_blank"
									danger
								>
									{ __(
										'Request access',
										'google-site-kit'
									) }
								</Button>
							</Fragment>
						) : (
							<Button onClick={ handleRetry } danger>
								{ __( 'Retry', 'google-site-kit' ) }
							</Button>
						) }
					</div>
				</div>
			</div>
		</div>
	);
}

AudienceTileError.propTypes = {
	errors: PropTypes.array.isRequired,
};
