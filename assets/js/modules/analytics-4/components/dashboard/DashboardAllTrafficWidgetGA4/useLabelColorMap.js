// useLabelColorMap.js

import { useRef } from '@wordpress/element';

const PIE_CHART_COLORS = [
	'#fece72',
	'#a983e6',
	'#bed4ff',
	'#ee92da',
	'#ff9b7a',
	'#7fc6b9',
	'#ffb1c1',
	'#c9a0dc',
	'#f5b041',
	'#85c1e9',
];

export function useLabelColorMap() {
	const labelColorMapRef = useRef( {} );
	const usedColorsRef = useRef( new Set() );

	function getColorForLabel( label ) {
		const map = labelColorMapRef.current;
		const usedColors = usedColorsRef.current;

		if ( map[ label ] ) {
			return map[ label ];
		}

		const availableColor =
			PIE_CHART_COLORS.find( ( color ) => ! usedColors.has( color ) ) ||
			'#ccc';

		map[ label ] = availableColor;
		usedColors.add( availableColor );

		return availableColor;
	}

	return getColorForLabel;
}
