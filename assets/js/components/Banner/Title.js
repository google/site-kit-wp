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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';

export default function Title( { className, children } ) {
	const breakpoint = useBreakpoint();

	const type = breakpoint === BREAKPOINT_SMALL ? TYPE_TITLE : TYPE_HEADLINE;
	const size = breakpoint === BREAKPOINT_TABLET ? SIZE_SMALL : SIZE_MEDIUM;

	return (
		<P
			className={ classnames( 'googlesitekit-banner__title', className ) }
			size={ size }
			type={ type }
		>
			{ children }
		</P>
	);
}

Title.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
};
