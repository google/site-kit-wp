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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import MainBody from './MainBody';

export default function OverlayCard( {
	className,
	children,
	title,
	description,
	ctaButton,
	dismissButton,
	GraphicDesktop,
	GraphicMobile,
	visible,
} ) {
	const breakpoint = useBreakpoint();

	if ( ! visible ) {
		return null;
	}

	const classes = classnames( 'googlesitekit-overlay-card', className );

	if ( breakpoint === BREAKPOINT_SMALL ) {
		return (
			<div className={ classes }>
				<MainBody
					title={ title }
					description={ description }
					ctaButton={ ctaButton }
					dismissButton={ dismissButton }
					GraphicDesktop={ GraphicDesktop }
					GraphicMobile={ GraphicMobile }
				>
					{ children }
				</MainBody>
			</div>
		);
	}

	return (
		<Slide direction="up" in={ visible }>
			<div className={ classes }>
				<MainBody
					title={ title }
					description={ description }
					ctaButton={ ctaButton }
					dismissButton={ dismissButton }
					GraphicDesktop={ GraphicDesktop }
					GraphicMobile={ GraphicMobile }
				>
					{ children }
				</MainBody>
			</div>
		</Slide>
	);
}

export const buttonProps = {
	label: PropTypes.string.isRequired,
	clickCallback: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

OverlayCard.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	title: PropTypes.string,
	description: PropTypes.string,
	ctaButton: PropTypes.shape( {
		...buttonProps,
		external: PropTypes.bool,
	} ),
	dismissButton: PropTypes.shape( {
		...buttonProps,
	} ),
	GraphicDesktop: PropTypes.elementType,
	GraphicMobile: PropTypes.elementType,
	visible: PropTypes.bool,
};

OverlayCard.defaultProps = {
	visible: false,
};
