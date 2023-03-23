/**
 * Material UI > Layout > Row component.
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
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const Row = forwardRef( ( { className, children, ...otherProps }, ref ) => {
	return (
		<div
			ref={ ref }
			className={ classnames( 'mdc-layout-grid__inner', className ) }
			{ ...otherProps }
		>
			{ children }
		</div>
	);
} );

Row.displayName = 'Row';

Row.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
};

Row.defaultProps = {
	className: '',
};

export default Row;
