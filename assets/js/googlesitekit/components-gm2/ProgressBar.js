/**
 * ProgressBar component.
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

export default function ProgressBar( {
	className,
	small,
	compress,
	indeterminate,
	height,
	progress,
} ) {
	const margin =
		typeof height !== 'undefined' ? Math.round( height / 2 ) : undefined;
	const transform = progress ? `scaleX(${ progress })` : undefined;

	return (
		<div
			role="progressbar"
			style={ { marginTop: margin, marginBottom: margin } }
			className={ classnames( 'mdc-linear-progress', className, {
				'mdc-linear-progress--indeterminate': indeterminate,
				'mdc-linear-progress--small': small,
				'mdc-linear-progress--compress': compress,
			} ) }
		>
			<div className="mdc-linear-progress__buffering-dots" />
			<div className="mdc-linear-progress__buffer" />
			<div
				className="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
				style={ { transform } }
			>
				<span className="mdc-linear-progress__bar-inner" />
			</div>
			<div className="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
				<span className="mdc-linear-progress__bar-inner" />
			</div>
		</div>
	);
}

ProgressBar.propTypes = {
	className: PropTypes.string,
	small: PropTypes.bool,
	compress: PropTypes.bool,
	indeterminate: PropTypes.bool,
	progress: PropTypes.number,
	height: PropTypes.number,
};

ProgressBar.defaultProps = {
	className: '',
	small: false,
	compress: false,
	indeterminate: true,
	progress: 0,
};
