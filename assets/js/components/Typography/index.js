/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { VALID_TYPES, VALID_SIZES } from './constants';

export default function Typography( {
	className,
	type,
	size,
	as: Component = 'span',
	children,
	...props
} ) {
	return (
		<Component
			className={ classnames( 'googlesitekit-typography', className, {
				[ `googlesitekit-typography--${ type }` ]:
					type && VALID_TYPES.includes( type ),
				[ `googlesitekit-typography--${ size }` ]:
					size && VALID_SIZES.includes( size ),
			} ) }
			{ ...props }
		>
			{ children }
		</Component>
	);
}

Typography.propTypes = {
	className: PropTypes.string,
	type: PropTypes.oneOf( VALID_TYPES ),
	size: PropTypes.oneOf( VALID_SIZES ),
	as: PropTypes.oneOfType( [ PropTypes.string, PropTypes.elementType ] ),
};
