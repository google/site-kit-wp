/**
 * KeyMetricsPDF component for @react-pdf/renderer.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { KeyMetricsPDFTile } from './getPDFData';

const styles = createPDFStyles( {
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	tile: {
		// Four tiles per row, so the grid wraps to a new row every four tiles.
		width: '25%',
		marginBottom: 24,
	},
	tileInner: {
		// A small gutter between the grid columns.
		marginRight: 24,
	},
} );

/**
 * Renders the user's configured Key Metrics tiles as a four-column PDF grid.
 *
 * Each tile renders its own `TileComponent` from the data the aggregate loader
 * resolved, in the user's configured order. A tile whose data failed to load
 * (`data: null`) is dropped rather than shown as a placeholder, matching how the
 * rest of the report omits empty content; the remaining tiles reflow to fill the
 * grid.
 *
 * @since n.e.x.t
 *
 * @param props      Component props.
 * @param props.data The aggregate loader output, `{ tiles }`.
 * @return The Key Metrics PDF grid.
 */
const KeyMetricsPDF: FC< PDFWidgetComponentProps > = ( { data } ) => {
	const { tiles = [] } = ( data as { tiles?: KeyMetricsPDFTile[] } ) || {};

	return (
		<View style={ styles.container }>
			{ tiles
				.filter( ( tile ) => tile.data )
				.map( ( tile ) => {
					const TileComponent = tile.TileComponent;

					return (
						<View key={ tile.slug } style={ styles.tile }>
							<View style={ styles.tileInner }>
								<TileComponent
									title={ tile.title }
									{ ...( tile.data as Record<
										string,
										unknown
									> ) }
								/>
							</View>
						</View>
					);
				} ) }
		</View>
	);
};

export default KeyMetricsPDF;
