/**
 * PDFMetricTile component for @react-pdf/renderer.
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
import { Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { FC } from 'react';

const COLORS = {
	text: '#212121',
	secondary: '#646464',
	success: '#34a853',
	error: '#ea4335',
	cardBg: '#f8f9fa',
};

const tileStyles = StyleSheet.create( {
	container: {
		backgroundColor: COLORS.cardBg,
		borderRadius: 4,
		padding: 12,
	},
	title: {
		fontSize: 9,
		color: COLORS.secondary,
		marginBottom: 4,
	},
	value: {
		fontSize: 28,
		fontWeight: 'bold',
		color: COLORS.text,
	},
	subText: {
		fontSize: 9,
		color: COLORS.secondary,
		marginTop: 4,
	},
	changeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
		gap: 3,
	},
	changeText: {
		fontSize: 9,
	},
} );

interface ChangeArrowProps {
	direction: 'up' | 'down';
	color: string;
}

function ChangeArrow( { direction, color }: ChangeArrowProps ) {
	return (
		<Svg width={ 8 } height={ 8 } viewBox="0 0 8 8">
			<Path
				d={
					direction === 'up' ? 'M4,0 L8,8 L0,8 Z' : 'M0,0 L8,0 L4,8 Z'
				}
				fill={ color }
			/>
		</Svg>
	);
}

export interface PDFMetricTileProps {
	/** Heading rendered above the metric value, e.g. "All Visitors". */
	title: string;
	/** Pre-formatted metric value to display prominently, e.g. "1.2K". */
	value: string;
	/** Pre-formatted change badge text, e.g. "12.5%". Hides the badge when omitted. */
	change?: string;
	/** Direction the change badge points; controls the arrow and color. */
	changeDirection?: 'up' | 'down';
	/** Optional caption rendered below the value, e.g. comparison period text. */
	subText?: string;
}

const PDFMetricTile: FC< PDFMetricTileProps > = ( {
	title,
	value,
	change,
	changeDirection,
	subText,
} ) => {
	const changeColor =
		changeDirection === 'up' ? COLORS.success : COLORS.error;

	return (
		<View style={ tileStyles.container }>
			<Text style={ tileStyles.title }>{ title }</Text>
			<Text style={ tileStyles.value }>{ value }</Text>
			{ subText && <Text style={ tileStyles.subText }>{ subText }</Text> }
			{ change !== undefined && change !== null && changeDirection && (
				<View style={ tileStyles.changeRow }>
					<ChangeArrow
						direction={ changeDirection }
						color={ changeColor }
					/>
					<Text
						style={ [
							tileStyles.changeText,
							{ color: changeColor },
						] }
					>
						{ change }
					</Text>
				</View>
			) }
		</View>
	);
};

export default PDFMetricTile;
