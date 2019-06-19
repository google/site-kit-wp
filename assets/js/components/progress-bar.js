/**
 * ProgressBar component.
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

class ProgressBar extends Component {
	render() {
		const {
			className,
			small,
			compress,
			height,
		} = this.props;

		const margin = height ? Math.round( height / 2 ) : null;

		return (
			<div
				role="progressbar"
				className={ `
					mdc-linear-progress
					mdc-linear-progress--indeterminate
					${ className ? className : '' }
					${ small ? 'mdc-linear-progress--small' : '' }
					${ compress ? 'mdc-linear-progress--compress' : '' }
				` }
				style={ { marginTop: margin, marginBottom: margin } }
			>
				<div className="mdc-linear-progress__buffering-dots"></div>
				<div className="mdc-linear-progress__buffer"></div>
				<div className="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
					<span className="mdc-linear-progress__bar-inner"></span>
				</div>
				<div className="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
					<span className="mdc-linear-progress__bar-inner"></span>
				</div>
			</div>
		);
	}
}

ProgressBar.propTypes = {
	className: PropTypes.string,
	small: PropTypes.bool,
	compress: PropTypes.bool,
};

ProgressBar.defaultProps = {
	className: '',
	small: false,
	compress: false,
};

export default ProgressBar;
