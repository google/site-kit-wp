/**
 * Site Kit by Google, Copyright 2022 Google LLC
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

function ColorThemeChoice( { colorPrimary, colorSecondary } ) {
	return (
		<svg
			width="37"
			height="37"
			viewBox="0 0 37 37"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="6.02148"
				y="31.6396"
				width="36"
				height="18"
				transform="rotate(-45 6.02148 31.6396)"
				fill={ colorSecondary }
			/>
			<rect
				x="-6.70703"
				y="18.9117"
				width="36"
				height="18"
				transform="rotate(-45 -6.70703 18.9117)"
				fill={ colorPrimary }
			/>
		</svg>
	);
}

ColorThemeChoice.propTypes = {
	colorPrimary: PropTypes.string.isRequired,
	colorSecondary: PropTypes.string.isRequired,
};

// The default color props are for the blue option, which appears first in the list.
ColorThemeChoice.defaultProps = {
	colorPrimary: '#1967D2',
	colorSecondary: '#E3F2FD',
};

export default ColorThemeChoice;
