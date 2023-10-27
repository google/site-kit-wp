/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import MetricTileError from '../../../../components/KeyMetrics/MetricTileError';
import { trackEvent, trackEventOnce } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';

export default function CustomDimensionsMissingError( props ) {
	const { onRetry, infoTooltip, headerText } = props;

	const viewContext = useViewContext();

	useEffect( () => {
		trackEventOnce(
			`${ viewContext }_kmw`,
			'custom_dimension_missing_error'
		);
	}, [ viewContext ] );

	const retry = useCallback( () => {
		trackEvent(
			`${ viewContext }_kmw`,
			'custom_dimension_missing_error_retry'
		);
		onRetry?.();
	}, [ onRetry, viewContext ] );

	return (
		<MetricTileError
			title={ __( 'No data to show', 'google-site-kit' ) }
			headerText={ headerText }
			infoTooltip={ infoTooltip }
		>
			<div className="googlesitekit-report-error-actions">
				<Button onClick={ retry }>
					{ __( 'Update', 'google-site-kit' ) }
				</Button>
				<span className="googlesitekit-error-retry-text">
					{ __(
						'Update Analytics to track metric',
						'google-site-kit'
					) }
				</span>
			</div>
		</MetricTileError>
	);
}

CustomDimensionsMissingError.propTypes = {
	onRetry: PropTypes.func.isRequired,
	headerText: PropTypes.string,
	infoTooltip: PropTypes.string,
};
