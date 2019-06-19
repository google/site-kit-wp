/**
 * PreviewBlock component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import PropTypes from 'prop-types';

const { Component } = wp.element;

class PreviewBlock extends Component {

	render() {
		const {
			width,
			height,
			shape,
			padding,
		} = this.props;

		return (
			<div
				className={ `
					googlesitekit-preview-block
					${ padding ? 'googlesitekit-preview-block--padding' : '' }
				` }
				style={ {
					width,
					height,
				} }
			>
				<div
					className={ `
					googlesitekit-preview-block__wrapper
					${ 'circular' === shape ? 'googlesitekit-preview-block__wrapper--circle' : '' }
				` }
				></div>
			</div>
		);
	}
}

PreviewBlock.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	shape: PropTypes.string,
	padding: PropTypes.bool,
};

PreviewBlock.defaultProps = {
	width: '100px',
	height: '100px',
	shape: 'square',
	padding: false,
};

export default PreviewBlock;
