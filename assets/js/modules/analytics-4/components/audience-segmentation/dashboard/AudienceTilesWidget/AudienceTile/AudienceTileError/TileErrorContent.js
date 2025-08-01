/**
 * TileErrorContent component.
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
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isInsufficientPermissionsError } from '../../../../../../../../util/errors';
import AudienceTileErrorImage from '../../../../../../../../../svg/graphics/analytics-audience-segmentation-tile-error.svg';
import ReportErrorActions from '../../../../../../../../components/ReportErrorActions';
import GetHelpLink from '../../../GetHelpLink';
import Typography from '../../../../../../../../components/Typography';

const TileErrorContent = forwardRef(
	( { errors, onRetry, onRequestAccess }, ref ) => {
		const hasInsufficientPermissionsError = errors.some( ( err ) =>
			isInsufficientPermissionsError( err )
		);

		return (
			<div
				className="googlesitekit-audience-segmentation-tile-error"
				ref={ ref }
			>
				<div className="googlesitekit-audience-segmentation-tile-error__container">
					<AudienceTileErrorImage className="googlesitekit-audience-segmentation-tile-error__image" />
					<div className="googlesitekit-audience-segmentation-tile-error__body">
						<div className="googlesitekit-audience-segmentation-tile-error__message">
							<Typography
								as="h3"
								type="headline"
								size="small"
								className="googlesitekit-audience-segmentation-tile-error__title"
							>
								{ hasInsufficientPermissionsError
									? __(
											'Insufficient permissions',
											'google-site-kit'
									  )
									: __(
											'Data loading failed',
											'google-site-kit'
									  ) }
							</Typography>
						</div>
						<div className="googlesitekit-audience-segmentation-tile-error__actions">
							<ReportErrorActions
								moduleSlug="analytics-4"
								error={ errors }
								GetHelpLink={
									hasInsufficientPermissionsError
										? GetHelpLink
										: undefined
								}
								hideGetHelpLink={
									! hasInsufficientPermissionsError
								}
								buttonVariant="danger"
								onRetry={ onRetry }
								onRequestAccess={ onRequestAccess }
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
);

TileErrorContent.propTypes = {
	errors: PropTypes.array.isRequired,
	onRetry: PropTypes.func.isRequired,
	onRequestAccess: PropTypes.func.isRequired,
};

export default TileErrorContent;
