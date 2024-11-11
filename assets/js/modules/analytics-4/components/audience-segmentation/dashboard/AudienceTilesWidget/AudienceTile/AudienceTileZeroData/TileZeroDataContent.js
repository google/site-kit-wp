/**
 * ZeroDataContent component.
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

/**
 * Internal dependencies
 */
import useViewContext from '../../../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../../../util';
import InfoTooltip from '../../../../../../../../components/InfoTooltip';
import AudienceTileCollectingData from '../AudienceTileCollectingData';
import AudienceTileCollectingDataHideable from '../AudienceTileCollectingDataHideable';

const TileZeroDataContent = forwardRef(
	(
		{
			Widget,
			audienceSlug,
			title,
			infoTooltip,
			isMobileBreakpoint,
			isTileHideable,
			onHideTile,
		},
		ref
	) => {
		const viewContext = useViewContext();

		return (
			<Widget ref={ ref } noPadding>
				<div className="googlesitekit-audience-segmentation-tile">
					<div className="googlesitekit-audience-segmentation-tile__zero-data-container">
						{ ! isMobileBreakpoint && (
							<div className="googlesitekit-audience-segmentation-tile__header">
								<div className="googlesitekit-audience-segmentation-tile__header-title">
									{ title }
									{ infoTooltip && (
										<InfoTooltip
											title={ infoTooltip }
											tooltipClassName="googlesitekit-info-tooltip__content--audience"
											onOpen={ () =>
												trackEvent(
													`${ viewContext }_audiences-tile`,
													'view_tile_tooltip',
													audienceSlug
												)
											}
										/>
									) }
								</div>
							</div>
						) }
						<div className="googlesitekit-audience-segmentation-tile__zero-data-content">
							<AudienceTileCollectingData />
							{ isTileHideable && (
								<AudienceTileCollectingDataHideable
									onHideTile={ onHideTile }
								/>
							) }
						</div>
					</div>
				</div>
			</Widget>
		);
	}
);

TileZeroDataContent.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	audienceSlug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	isMobileBreakpoint: PropTypes.bool,
	isTileHideable: PropTypes.bool,
	onHideTile: PropTypes.func,
};

export default TileZeroDataContent;
