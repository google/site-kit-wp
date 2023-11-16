/**
 * MetricTileWrapper component.
 *
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
import classnames from 'classnames';
import { castArray } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';
import GetHelpLink from './GetHelpLink';
import MetricTileLoader from './MetricTileLoader';
import MetricTileError from './MetricTileError';
import MetricTileHeader from './MetricTileHeader';
import ReportErrorActions from '../ReportErrorActions';
import { isInsufficientPermissionsError } from '../../util/errors';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export default function MetricTileWrapper( props ) {
	const {
		className,
		children,
		error,
		loading,
		moduleSlug,
		Widget,
		widgetSlug,
		title = KEY_METRICS_WIDGETS[ widgetSlug ]?.title,
		infoTooltip = KEY_METRICS_WIDGETS[ widgetSlug ]?.infoTooltip ||
			KEY_METRICS_WIDGETS[ widgetSlug ]?.description,
	} = props;

	const viewContext = useViewContext();

	const hasInsufficientPermissionsReportError = error
		? castArray( error ).some( isInsufficientPermissionsError )
		: false;

	const trackRetryEvent = useCallback( () => {
		trackEvent( `${ viewContext }_kmw`, 'data_loading_error_retry' );
	}, [ viewContext ] );

	useEffect( () => {
		if ( !! error ) {
			trackEvent( `${ viewContext }_kmw`, 'data_loading_error' );
		}
	}, [ viewContext, error ] );

	if ( error ) {
		return (
			<MetricTileError
				title={
					hasInsufficientPermissionsReportError
						? __( 'Insufficient permissions', 'google-site-kit' )
						: __( 'Data loading failed', 'google-site-kit' )
				}
				headerText={ title }
				infoTooltip={ infoTooltip }
			>
				<ReportErrorActions
					moduleSlug={ moduleSlug }
					error={ error }
					onRetry={ trackRetryEvent }
					GetHelpLink={
						hasInsufficientPermissionsReportError
							? GetHelpLink
							: undefined
					}
					getHelpClassName="googlesitekit-error-retry-text"
				/>
			</MetricTileError>
		);
	}

	return (
		<Widget noPadding>
			<div
				className={ classnames(
					'googlesitekit-km-widget-tile',
					className
				) }
			>
				<MetricTileHeader
					title={ title }
					infoTooltip={ infoTooltip }
					loading={ loading }
				/>
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && <MetricTileLoader /> }
					{ ! loading && children }
				</div>
			</div>
		</Widget>
	);
}

MetricTileWrapper.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool,
	title: PropTypes.string,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	moduleSlug: PropTypes.string.isRequired,
};
