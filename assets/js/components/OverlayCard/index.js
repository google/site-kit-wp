/**
 * OverlayCard component.
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
import { Slide } from '@material-ui/core';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import Body from './Body';
import { buttonProps } from './DismissButton';

export default function OverlayCard( props ) {
	const { visible, className, ...cardProps } = props;

	const breakpoint = useBreakpoint();

	if ( ! visible ) {
		return null;
	}

	const body = (
		<div
			className={ classnames( 'googlesitekit-overlay-card', className ) }
		>
			<Body { ...cardProps } />
		</div>
	);

	if ( breakpoint === BREAKPOINT_SMALL ) {
		return body;
	}

	return (
		<Slide direction="up" in={ visible }>
			{ body }
		</Slide>
	);
}

OverlayCard.propTypes = {
	className: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ),
	ctaButton: PropTypes.shape( {
		...buttonProps,
		href: PropTypes.string,
		target: PropTypes.string,
		trailingIcon: PropTypes.object,
	} ),
	dismissButton: PropTypes.shape( buttonProps ),
	GraphicDesktop: PropTypes.elementType,
	GraphicMobile: PropTypes.elementType,
	visible: PropTypes.bool,
};

OverlayCard.defaultProps = {
	visible: false,
};
