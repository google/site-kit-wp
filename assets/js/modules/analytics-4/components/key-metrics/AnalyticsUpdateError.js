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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../components/Link';
import MetricTileError from '../../../../components/KeyMetrics/MetricTileError';
import { trackEvent, trackEventOnce } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect } = Data;

export default function AnalyticsUpdateError( props ) {
	const { onRetry, error, infoTooltip, headerText } = props;

	const viewContext = useViewContext();

	const helpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( error )
	);

	useEffect( () => {
		trackEventOnce( `${ viewContext }_kmw`, 'analytics_update_error' );
	}, [ viewContext ] );

	const retry = useCallback( () => {
		trackEvent( `${ viewContext }_kmw`, 'analytics_update_error_retry' );
		onRetry?.();
	}, [ onRetry, viewContext ] );

	return (
		<MetricTileError
			title={ __( 'Analytics update failed', 'google-site-kit' ) }
			headerText={ headerText }
			infoTooltip={ infoTooltip }
		>
			<div className="googlesitekit-report-error-actions">
				<Button onClick={ retry }>
					{ __( 'Retry', 'google-site-kit' ) }
				</Button>
				<span className="googlesitekit-error-retry-text">
					{ createInterpolateElement(
						__(
							'Retry didn’t work? <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: <Link href={ helpLink } external />,
						}
					) }
				</span>
			</div>
		</MetricTileError>
	);
}

AnalyticsUpdateError.propTypes = {
	error: PropTypes.shape( {} ).isRequired,
	onRetry: PropTypes.func.isRequired,
	headerText: PropTypes.string,
	infoTooltip: PropTypes.string,
};
