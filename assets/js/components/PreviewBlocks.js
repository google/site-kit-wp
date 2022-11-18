/**
 * PreviewBlocks component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import PreviewBlock from './PreviewBlock';

function PreviewBlocks( {
	width,
	height,
	shape,
	count,
	smallWidth,
	smallHeight,
	tabletWidth,
	tabletHeight,
	desktopWidth,
	desktopHeight,
} ) {
	const toReturn = [];
	let i = 0;
	while ( i++ < count ) {
		toReturn.push(
			<PreviewBlock
				width={ width }
				height={ height }
				shape={ shape }
				smallWidth={ smallWidth }
				smallHeight={ smallHeight }
				tabletWidth={ tabletWidth }
				tabletHeight={ tabletHeight }
				desktopWidth={ desktopWidth }
				desktopHeight={ desktopHeight }
				key={ i }
			/>
		);
	}

	return toReturn;
}

PreviewBlocks.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	shape: PropTypes.string,
	count: PropTypes.number,
	smallWidth: PropTypes.string,
	smallHeight: PropTypes.string,
	tabletWidth: PropTypes.string,
	tabletHeight: PropTypes.string,
	desktopWidth: PropTypes.string,
	desktopHeight: PropTypes.string,
};

PreviewBlocks.defaultProps = {
	width: '100px',
	height: '100px',
	shape: 'square',
	count: 1,
};

export default PreviewBlocks;
