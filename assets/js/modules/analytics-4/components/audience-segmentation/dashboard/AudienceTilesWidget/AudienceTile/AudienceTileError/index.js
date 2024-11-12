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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { isInsufficientPermissionsError } from '../../../../../../../../util/errors';
import TileErrorContent from './TileErrorContent';
import withIntersectionObserver from '../../../../../../../../util/withIntersectionObserver';
import useViewContext from '../../../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../../../util';

const TileErrorContentWithIntersectionObserver =
	withIntersectionObserver( TileErrorContent );

export default function AudienceTileError( { audienceSlug, errors } ) {
	const viewContext = useViewContext();
	const hasInsufficientPermissionsError = errors.some( ( err ) =>
		isInsufficientPermissionsError( err )
	);

	return (
		<TileErrorContentWithIntersectionObserver
			errors={ errors }
			onInView={ () => {
				const action = hasInsufficientPermissionsError
					? 'insufficient_permissions_error'
					: 'data_loading_error';

				trackEvent(
					`${ viewContext }_audiences-tile`,
					action,
					audienceSlug
				);
			} }
			onRetry={ () => {
				trackEvent(
					`${ viewContext }_audiences-tile`,
					'data_loading_error_retry',
					audienceSlug
				);
			} }
			onRequestAccess={ () => {
				trackEvent(
					`${ viewContext }_audiences-tile`,
					'insufficient_permissions_error_request_access',
					audienceSlug
				);
			} }
		/>
	);
}

AudienceTileError.propTypes = {
	audienceSlug: PropTypes.string.isRequired,
	errors: PropTypes.array.isRequired,
};
