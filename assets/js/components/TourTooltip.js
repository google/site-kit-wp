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
import { createIncrementalArrayBySize } from '@/js/util/create-incremental-array-by-size';
import { useFeature } from '@/js/hooks/useFeature';
import CloseIcon from '@/svg/icons/close.svg';
import Typography from './Typography';

export default function TourTooltip( {
	backProps,
	closeProps,
	index,
	primaryProps,
	size,
	step,
	tooltipProps,
} ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const indicatorArray = size > 1 ? createIncrementalArrayBySize( size ) : [];
	function getIndicatorClassName( indicatorIndex ) {
		return classnames( 'googlesitekit-tooltip-indicator', {
			active: indicatorIndex === index,
		} );
	}

	// Determine close icon size based on feature flag.
	const closeIconSize = setupFlowRefreshEnabled ? 10 : 14;

	return (
		<div
			className={ classnames(
				'googlesitekit-tour-tooltip',
				step.className,
				{
					'googlesitekit-tour-tooltip--setupFlowRefresh':
						setupFlowRefreshEnabled,
				}
			) }
			{ ...tooltipProps }
		>
			<Card className="googlesitekit-tooltip-card">
				<div className="googlesitekit-tooltip-body">
					<Typography
						as="h2"
						className="googlesitekit-tooltip-title"
						size="medium"
						type="title"
					>
						{ step.title }
					</Typography>
					<Typography
						as="div"
						className="googlesitekit-tooltip-content"
						size={ setupFlowRefreshEnabled ? 'medium' : 'small' }
						type="body"
					>
						{ step.content }
					</Typography>
				</div>
				<CardActions className="googlesitekit-tooltip-actions">
					{ ! setupFlowRefreshEnabled && (
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
					) }
					{ setupFlowRefreshEnabled && (
						<p className="googlesitekit-tooltip-steps">
							{ index + 1 } / { size }
						</p>
					) }
					<div className="googlesitekit-tooltip-buttons">
						{ index !== 0 && (
							<Button
								className="googlesitekit-tooltip-button"
								text={ ! setupFlowRefreshEnabled }
								tertiary={ setupFlowRefreshEnabled }
								{ ...backProps }
							>
								{ backProps.title }
							</Button>
						) }
						{ step.cta }
						{ primaryProps.title && (
							<Button
								className={ classnames(
									'googlesitekit-tooltip-button',
									{
										'googlesitekit-tooltip-button--primary':
											setupFlowRefreshEnabled,
									}
								) }
								text={ ! setupFlowRefreshEnabled }
								{ ...primaryProps }
							>
								{ primaryProps.title }
							</Button>
						) }
					</div>
				</CardActions>
				<Button
					className="googlesitekit-tooltip-close"
					icon={
						<CloseIcon
							width={ closeIconSize }
							height={ closeIconSize }
						/>
					}
					onClick={ closeProps.onClick }
					aria-label={ __( 'Close', 'google-site-kit' ) }
					text
					hideTooltipTitle
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
		title: PropTypes.node,
		cta: PropTypes.oneOfType( [ PropTypes.element, PropTypes.bool ] ),
		className: PropTypes.string,
	} ).isRequired,
	tooltipProps: PropTypes.object.isRequired,
};
