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

export default function Cell( { className, sm, md, lg, children } ) {
	return (
		<div className={ classnames(
			className,
			'mdc-layout-grid__cell',
			{
				[ `mdc-layout-grid__cell--span-${ lg }-desktop` ]: lg,
				[ `mdc-layout-grid__cell--span-${ md }-tablet` ]: md,
				[ `mdc-layout-grid__cell--span-${ sm }-phone` ]: sm,
			},
		) }>
			{ children }
		</div>
	);
}

Cell.propTypes = {
	sm: PropTypes.number,
	md: PropTypes.number,
	lg: PropTypes.number,
	className: PropTypes.string,
	children: PropTypes.oneOfType( [
		PropTypes.node,
		PropTypes.arrayOf( PropTypes.node ),
	] ).isRequired,
};

Cell.defaultProps = {
	className: '',
	sm: 4,
	md: 8,
	lg: 12,
};
