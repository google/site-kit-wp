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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import Title from './Title';
import Description from './Description';
import DismissButton from './DismissButton';
import PrimaryButton from './PrimaryButton';

export { Title, Description, DismissButton, PrimaryButton };

export default function OverlayCard( {
	className,
	children,
	title,
	description,
	primaryCTA,
	tertiaryCTA,
	GraphicDesktop,
	GraphicMobile,
	visible,
} ) {
	const breakpoint = useBreakpoint();

	if ( ! visible ) {
		return null;
	}

	const classes = classnames( 'googlesitekit-overlay-card', className );

	const renderContent = () => (
		<Fragment>
			{ breakpoint !== BREAKPOINT_SMALL && GraphicDesktop && (
				<div className="googlesitekit-overlay-card__graphic">
					<GraphicDesktop />
				</div>
			) }

			<div className="googlesitekit-overlay-card__body">
				{ title && <Title>{ title }</Title> }
				{ description && <Description>{ description }</Description> }
				{ children }
			</div>

			{ ( primaryCTA || tertiaryCTA ) && (
				<div className="googlesitekit-overlay-card__actions">
					{ tertiaryCTA && (
						<DismissButton
							label={ tertiaryCTA.label }
							onClick={ tertiaryCTA.clickCallback }
							disabled={ tertiaryCTA.disabled }
						/>
					) }
					{ primaryCTA && (
						<PrimaryButton
							label={ primaryCTA.label }
							onClick={ primaryCTA.clickCallback }
							disabled={ primaryCTA.disabled }
							external={ primaryCTA.external }
						/>
					) }
				</div>
			) }

			{ breakpoint === BREAKPOINT_SMALL && GraphicMobile && (
				<GraphicMobile />
			) }
		</Fragment>
	);

	if ( breakpoint === BREAKPOINT_SMALL ) {
		return <div className={ classes }>{ renderContent() }</div>;
	}

	return (
		<Slide direction="up" in={ visible }>
			<div className={ classes }>{ renderContent() }</div>
		</Slide>
	);
}

OverlayCard.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	title: PropTypes.string,
	description: PropTypes.string,
	primaryCTA: PropTypes.shape( {
		label: PropTypes.string.isRequired,
		clickCallback: PropTypes.func.isRequired,
		disabled: PropTypes.bool,
		external: PropTypes.bool,
	} ),
	tertiaryCTA: PropTypes.shape( {
		label: PropTypes.string,
		clickCallback: PropTypes.func.isRequired,
		disabled: PropTypes.bool,
	} ),
	GraphicDesktop: PropTypes.elementType,
	GraphicMobile: PropTypes.elementType,
	visible: PropTypes.bool,
};

OverlayCard.defaultProps = {
	visible: false,
};
