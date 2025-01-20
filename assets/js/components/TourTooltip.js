/**
 * TourTooltip component.
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
import Card, { CardActions } from '@material/react-card';
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { createIncrementalArrayBySize } from '../util/create-incremental-array-by-size';
import CloseIcon from '../../svg/icons/close.svg';

export default function TourTooltip( {
	backProps,
	closeProps,
	index,
	primaryProps,
	size,
	step,
	tooltipProps,
} ) {
	const indicatorArray = size > 1 ? createIncrementalArrayBySize( size ) : [];
	const getIndicatorClassName = ( indicatorIndex ) =>
		classnames( 'googlesitekit-tooltip-indicator', {
			active: indicatorIndex === index,
		} );

	return (
		<div
			className={ classnames(
				'googlesitekit-tour-tooltip',
				step.className
			) }
			{ ...tooltipProps }
		>
			<Card className="googlesitekit-tooltip-card">
				<div className="googlesitekit-tooltip-body">
					<h2 className="googlesitekit-tooltip-title">
						{ step.title }
					</h2>
					<div className="googlesitekit-tooltip-content">
						{ step.content }
					</div>
				</div>
				<CardActions className="googlesitekit-tooltip-actions">
					<ul className="googlesitekit-tooltip-indicators">
						{ indicatorArray.map( ( indicatorIndex ) => (
							<li
								key={ `indicator-${ indicatorIndex }` }
								className={ getIndicatorClassName(
									indicatorIndex
								) }
							/>
						) ) }
					</ul>
					<div className="googlesitekit-tooltip-buttons">
						{ index !== 0 && (
							<Button
								className="googlesitekit-tooltip-button"
								text
								{ ...backProps }
							>
								{ backProps.title }
							</Button>
						) }
						{ step.cta }
						{ primaryProps.title && (
							<Button
								className="googlesitekit-tooltip-button"
								text
								{ ...primaryProps }
							>
								{ primaryProps.title }
							</Button>
						) }
					</div>
				</CardActions>
				<Button
					className="googlesitekit-tooltip-close"
					text
					hideTooltipTitle
					icon={ <CloseIcon width="14" height="14" /> }
					onClick={ closeProps.onClick }
					aria-label={ __( 'Close', 'google-site-kit' ) }
				/>
			</Card>
		</div>
	);
}

/**
 * All props are provided directly from `react-joyride`, intended for custom components.
 *
 * @since 1.28.0
 * @see {@link https://docs.react-joyride.com/custom-components#props-1}.
 */
TourTooltip.propTypes = {
	backProps: PropTypes.object.isRequired,
	closeProps: PropTypes.object.isRequired,
	index: PropTypes.number.isRequired,
	isLastStep: PropTypes.bool.isRequired,
	primaryProps: PropTypes.object.isRequired,
	size: PropTypes.number.isRequired,
	step: PropTypes.shape( {
		content: PropTypes.node,
		title: PropTypes.node.isRequired,
		cta: PropTypes.oneOfType( [ PropTypes.element, PropTypes.bool ] ),
		className: PropTypes.string,
	} ).isRequired,
	tooltipProps: PropTypes.object.isRequired,
};
