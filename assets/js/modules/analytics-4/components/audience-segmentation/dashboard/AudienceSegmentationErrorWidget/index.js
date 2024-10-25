/**
 * AudienceSegmentationErrorWidget component.
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
import { castArray } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

import whenActive from '../../../../../../util/when-active';
import { useDispatch } from 'googlesitekit-data';
import { isInsufficientPermissionsError } from '../../../../../../util/errors';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { AUDIENCE_INFO_NOTICE_HIDE_UI } from '../InfoNoticeWidget/constants';
import ErrorWidgetContent from './ErrorWidgetContent';
import withIntersectionObserver from '../../../../../../util/withIntersectionObserver';
import { trackEvent } from '../../../../../../util';
import useViewContext from '../../../../../../hooks/useViewContext';

const ErrorWidgetContentWithIntersectionObserver =
	withIntersectionObserver( ErrorWidgetContent );

function AudienceSegmentationErrorWidget( {
	Widget,
	errors,
	onRetry,
	showRetryButton,
} ) {
	const viewContext = useViewContext();

	const { setValue } = useDispatch( CORE_UI );

	const errorsArray = errors ? castArray( errors ) : [];

	const hasInsufficientPermissionsError = errorsArray.some(
		isInsufficientPermissionsError
	);

	const handleRetry = () => {
		trackEvent(
			`${ viewContext }_audiences-all-tiles`,
			'data_loading_error_retry'
		).finally( () => {
			setValue( AUDIENCE_INFO_NOTICE_HIDE_UI, false );
			onRetry?.();
		} );
	};

	useEffect( () => {
		// Set UI key to hide the info notice.
		setValue( AUDIENCE_INFO_NOTICE_HIDE_UI, true );
	}, [ setValue ] );

	return (
		<ErrorWidgetContentWithIntersectionObserver
			Widget={ Widget }
			errors={ errorsArray }
			onRetry={ handleRetry }
			onRequestAccess={ () => {
				trackEvent(
					`${ viewContext }_audiences-all-tiles`,
					'insufficient_permissions_error_request_access'
				);
			} }
			showRetryButton={ showRetryButton }
			onInView={ () => {
				const action = hasInsufficientPermissionsError
					? 'insufficient_permissions_error'
					: 'data_loading_error';

				trackEvent( `${ viewContext }_audiences-all-tiles`, action );
			} }
		/>
	);
}

AudienceSegmentationErrorWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	errors: PropTypes.oneOfType( [
		PropTypes.object,
		PropTypes.arrayOf( PropTypes.object ),
	] ).isRequired,
	onRetry: PropTypes.func,
	showRetryButton: PropTypes.bool,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceSegmentationErrorWidget
);
