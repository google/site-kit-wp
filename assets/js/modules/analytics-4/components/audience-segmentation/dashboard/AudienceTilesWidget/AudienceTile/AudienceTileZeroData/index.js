/**
 * AudienceTileZeroData component.
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
import useViewContext from '../../../../../../../../hooks/useViewContext';
import withIntersectionObserver from '../../../../../../../../util/withIntersectionObserver';
import { trackEvent } from '../../../../../../../../util';
import TileZeroDataContent from './TileZeroDataContent';

const TileZeroDataContentWithIntersectionObserver =
	withIntersectionObserver( TileZeroDataContent );

export default function AudienceTileZeroData( {
	Widget,
	audienceSlug,
	title,
	infoTooltip,
	isMobileBreakpoint,
	isTileHideable,
	onHideTile,
} ) {
	const viewContext = useViewContext();

	function handleHideTile() {
		trackEvent(
			`${ viewContext }_audiences-tile`,
			'temporarily_hide',
			audienceSlug
		).finally( onHideTile );
	}

	return (
		<TileZeroDataContentWithIntersectionObserver
			Widget={ Widget }
			audienceSlug={ audienceSlug }
			title={ title }
			infoTooltip={ infoTooltip }
			isMobileBreakpoint={ isMobileBreakpoint }
			isTileHideable={ isTileHideable }
			onHideTile={ handleHideTile }
			onInView={ () => {
				trackEvent(
					`${ viewContext }_audiences-tile`,
					'view_tile_collecting_data',
					audienceSlug
				);
			} }
		/>
	);
}

AudienceTileZeroData.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	audienceSlug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	isMobileBreakpoint: PropTypes.bool,
	isTileHideable: PropTypes.bool,
	onHideTile: PropTypes.func,
};
