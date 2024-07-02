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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import whenActive from '../../../../../util/when-active';
import { Cell, Grid, Row } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import AudienceSegmentationErrorSVG from '../../../../../../svg/graphics/audience-segmentation-error-full-width.svg';
import { isInsufficientPermissionsError } from '../../../../../util/errors';
import ReportErrorActions from '../../../../../components/ReportErrorActions';
import GetHelpLink from './GetHelpLink';

function AudienceSegmentationErrorWidget( { Widget, errors } ) {
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const isTabletBreakpoint = breakpoint === BREAKPOINT_TABLET;

	const hasInsufficientPermissionsError = errors
		? castArray( errors ).some( isInsufficientPermissionsError )
		: false;

	return (
		<Widget
			noPadding
			className="googlesitekit-audience-segmentation-error-widget"
		>
			<Grid
				collapsed
				className="googlesitekit-audience-segmentation-error__widget-primary-cell"
			>
				<Row>
					<Cell smSize={ 6 } mdSize={ 8 } lgSize={ 7 }>
						<h3 className="googlesitekit-publisher-win__title">
							{ hasInsufficientPermissionsError
								? __(
										'Insufficient permissions',
										'google-site-kit'
								  )
								: __(
										'Your visitor groups data loading failed',
										'google-site-kit'
								  ) }
						</h3>
						<div className="googlesitekit-widget-audience-segmentation-error__actions">
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
								getHelpClassName="googlesitekit-error-retry-text"
							/>
						</div>
					</Cell>
					{ ! isMobileBreakpoint && ! isTabletBreakpoint && (
						<Cell
							className="googlesitekit-widget-audience-segmentation-error__svg-wrapper"
							smSize={ 6 }
							mdSize={ 3 }
							lgSize={ 5 }
						>
							<AudienceSegmentationErrorSVG width="233px" />
						</Cell>
					) }
					{ isTabletBreakpoint && (
						<Cell
							className="googlesitekit-widget-audience-segmentation-error__svg-wrapper"
							mdSize={ 8 }
						>
							<AudienceSegmentationErrorSVG width="233px" />
						</Cell>
					) }
					{ isMobileBreakpoint && (
						<Cell
							className="googlesitekit-widget-audience-segmentation-error__svg-wrapper"
							smSize={ 8 }
						>
							<AudienceSegmentationErrorSVG width="233px" />
						</Cell>
					) }
				</Row>
			</Grid>
		</Widget>
	);
}

AudienceSegmentationErrorWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	errors: PropTypes.arrayOf( PropTypes.object ).isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceSegmentationErrorWidget
);
