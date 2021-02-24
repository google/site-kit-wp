/**
 * PreviewBlock component.
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
import classnames from 'classnames';
import { useEffect, useState } from '@wordpress/element';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { getBreakpoint } from '../util/get-breakpoint';
import { useBreakpoint } from '../hooks/useBreakpoint';

function PreviewBlock( {
	className,
	width,
	height,
	shape,
	padding,
	smWidth,
	smHeight,
	mdWidth,
	mdHeight,
	lgWidth,
	lgHeight,
} ) {
	const breakpoint = useBreakpoint();

	let blockWidth = width;
	let blockHeight = height;

	if ( 'small' === breakpoint && smWidth && smHeight ) {
		blockWidth = smWidth;
		blockHeight = smHeight;
	}

	if ( 'tablet' === breakpoint && mdWidth && mdHeight ) {
		blockWidth = mdWidth;
		blockHeight = mdHeight;
	}

	if ( ( 'xlarge' === breakpoint || 'desktop' === breakpoint ) && lgWidth && lgHeight ) {
		blockWidth = lgWidth;
		blockHeight = lgHeight;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-preview-block',
				className,
				{ 'googlesitekit-preview-block--padding': padding }
			) }
			style={ {
				width: blockWidth,
				height: blockHeight,
			} }
		>
			<div className={ classnames(
				'googlesitekit-preview-block__wrapper',
				{ 'googlesitekit-preview-block__wrapper--circle': shape === 'circular' }
			) }>
			</div>
		</div>
	);
}
PreviewBlock.propTypes = {
	className: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	shape: PropTypes.string,
	padding: PropTypes.bool,
};

PreviewBlock.defaultProps = {
	className: undefined,
	width: '100px',
	height: '100px',
	shape: 'square',
	padding: false,
};

export default PreviewBlock;
