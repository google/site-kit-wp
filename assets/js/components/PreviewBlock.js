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

/**
 * Internal dependencies
 */
import {
	useBreakpoint,
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	BREAKPOINT_DESKTOP,
	BREAKPOINT_XLARGE,
} from '../hooks/useBreakpoint';

function PreviewBlock( {
	className,
	width,
	height,
	shape,
	padding,
	smallWidth,
	smallHeight,
	tabletWidth,
	tabletHeight,
	desktopWidth,
	desktopHeight,
} ) {
	const breakpoint = useBreakpoint();

	const blockDimensions = {
		width: {
			[ BREAKPOINT_SMALL ]: smallWidth,
			[ BREAKPOINT_TABLET ]: tabletWidth,
			[ BREAKPOINT_DESKTOP ]: desktopWidth,
			[ BREAKPOINT_XLARGE ]: desktopWidth,
		},
		height: {
			[ BREAKPOINT_SMALL ]: smallHeight,
			[ BREAKPOINT_TABLET ]: tabletHeight,
			[ BREAKPOINT_DESKTOP ]: desktopHeight,
			[ BREAKPOINT_XLARGE ]: desktopWidth,
		},
	};

	return (
		<div
			className={ classnames( 'googlesitekit-preview-block', className, {
				'googlesitekit-preview-block--padding': padding,
			} ) }
			style={ {
				width: blockDimensions.width[ breakpoint ] || width,
				height: blockDimensions.height[ breakpoint ] || height,
			} }
		>
			<div
				className={ classnames(
					'googlesitekit-preview-block__wrapper',
					{
						'googlesitekit-preview-block__wrapper--circle':
							shape === 'circular',
					}
				) }
			></div>
		</div>
	);
}

PreviewBlock.propTypes = {
	className: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	shape: PropTypes.string,
	padding: PropTypes.bool,
	smallWidth: PropTypes.string,
	smallHeight: PropTypes.string,
	tabletWidth: PropTypes.string,
	tabletHeight: PropTypes.string,
	desktopWidth: PropTypes.string,
	desktopHeight: PropTypes.string,
};

PreviewBlock.defaultProps = {
	className: undefined,
	width: '100px',
	height: '100px',
	shape: 'square',
	padding: false,
	smallWidth: undefined,
	smallHeight: undefined,
	tabletWidth: undefined,
	tabletHeight: undefined,
	desktopWidth: undefined,
	desktopHeight: undefined,
};

export default PreviewBlock;
