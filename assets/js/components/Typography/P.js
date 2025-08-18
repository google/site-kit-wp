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

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import Typography from '.';
import {
	SIZE_SMALL,
	SIZE_MEDIUM,
	TYPE_BODY,
	VALID_SIZES,
	VALID_TYPES,
	VALID_WEIGHTS,
} from './constants';

export default function P( {
	type = TYPE_BODY,
	size,
	weight,
	children,
	...props
} ) {
	const breakpoint = useBreakpoint();

	return (
		<Typography
			as="p"
			type={ type }
			size={
				size ||
				( breakpoint === BREAKPOINT_SMALL ? SIZE_SMALL : SIZE_MEDIUM )
			}
			weight={ weight ?? 'normal' }
			{ ...props }
		>
			{ children }
		</Typography>
	);
}

P.propTypes = {
	size: PropTypes.oneOf( VALID_SIZES ),
	type: PropTypes.oneOf( VALID_TYPES ),
	weight: PropTypes.oneOf( VALID_WEIGHTS ),
};
