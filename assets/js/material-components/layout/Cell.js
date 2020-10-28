/**
 * Material UI > Layout > Cell component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export default function Cell( props ) {
	const {
		className,
		smSize,
		mdSize,
		lgSize,
		size,
		children,
	} = props;

	return (
		<div className={ classnames(
			className,
			'mdc-layout-grid__cell',
			{
				[ `mdc-layout-grid__cell--span-${ size }` ]: 12 >= size && size > 0,
				[ `mdc-layout-grid__cell--span-${ lgSize }-desktop` ]: 12 >= lgSize && lgSize > 0,
				[ `mdc-layout-grid__cell--span-${ mdSize }-tablet` ]: 8 >= mdSize && mdSize > 0,
				[ `mdc-layout-grid__cell--span-${ smSize }-phone` ]: 4 >= smSize && smSize > 0,
			},
		) }>
			{ children }
		</div>
	);
}

Cell.propTypes = {
	smSize: PropTypes.number,
	mdSize: PropTypes.number,
	lgSize: PropTypes.number,
	size: PropTypes.number,
	className: PropTypes.string,
	children: PropTypes.oneOfType( [
		PropTypes.node,
		PropTypes.arrayOf( PropTypes.node ),
	] ).isRequired,
};

Cell.defaultProps = {
	className: '',
	size: 0,
	smSize: 4,
	mdSize: 8,
	lgSize: 12,
};
