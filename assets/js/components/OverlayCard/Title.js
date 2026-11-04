/**
 * OverlayCard Title component.
 *
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
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';

export default function Title( { children } ) {
	const breakpoint = useBreakpoint();

	const size = breakpoint === BREAKPOINT_SMALL ? SIZE_MEDIUM : SIZE_SMALL;
	const type = breakpoint === BREAKPOINT_SMALL ? TYPE_TITLE : TYPE_HEADLINE;

	return (
		<Typography
			as="h3"
			className="googlesitekit-overlay-card__title"
			size={ size }
			type={ type }
		>
			{ children }
		</Typography>
	);
}

Title.propTypes = {
	children: PropTypes.node.isRequired,
};
