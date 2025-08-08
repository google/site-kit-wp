/**
 * AdSenseConnectCTA > Content component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __, _x } from '@wordpress/i18n';
import { forwardRef, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Row, Cell } from '../../../../../material-components';
import ContentSVG from './ContentSVG';
import AdSenseIcon from '../../../../../../svg/graphics/adsense.svg';
import Typography from '../../../../../components/Typography';

const Content = forwardRef( ( { stage, mode, onAnimationEnd }, ref ) => {
	const stageContent = [
		{
			title: __( 'Earn money from your site', 'google-site-kit' ),
			description: __(
				'Focus on writing good content and let AdSense help you make it profitable',
				'google-site-kit'
			),
		},
		{
			title: __( 'Save time with automated ads', 'google-site-kit' ),
			description: __(
				"Auto ads automatically place and optimize your ads for you so you don't have to spend time doing it yourself",
				'google-site-kit'
			),
		},
		{
			title: __( 'You’re in control', 'google-site-kit' ),
			description: __(
				"Block ads you don't like, customize where ads appear, and choose which types fit your site best",
				'google-site-kit'
			),
		},
	];

	const cellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	return (
		<Fragment>
			<Row>
				<Cell size={ 12 }>
					<Typography
						as="p"
						type="body"
						size="medium"
						className="googlesitekit-setup__intro-title"
					>
						{ __( 'Connect Service', 'google-site-kit' ) }
					</Typography>
					<div className="googlesitekit-setup-module">
						<div className="googlesitekit-setup-module__logo">
							<AdSenseIcon width="33" height="33" />
						</div>

						<Typography
							as="h3"
							className="googlesitekit-setup-module__title"
							size="small"
							type="headline"
						>
							{ _x(
								'AdSense',
								'Service name',
								'google-site-kit'
							) }
						</Typography>
					</div>
				</Cell>
			</Row>

			<Row ref={ ref }>
				<Cell
					{ ...cellProps }
					smOrder={ 2 }
					mdOrder={ 1 }
					className="googlesitekit-setup-module--adsense__stage-captions"
				>
					<ul className="googlesitekit-setup-module--adsense__stage-caption-container">
						{ stageContent.map(
							( { title, description }, index ) => (
								<li
									key={ index }
									className={ classnames(
										'googlesitekit-setup-module--adsense__stage-caption',
										{
											[ `googlesitekit-setup-module--adsense__stage-caption--current--${ mode }` ]:
												stage === index,
										}
									) }
								>
									<div className="googlesitekit-setup-module--adsense__stage-caption-indicator" />
									<div>
										<Typography
											as="h4"
											size="large"
											type="title"
										>
											{ title }
										</Typography>
										<Typography
											as="p"
											type="body"
											size="medium"
										>
											{ description }
										</Typography>
									</div>
								</li>
							)
						) }
					</ul>
					<ul className="googlesitekit-setup-module--adsense__stage-indicator">
						{ stageContent.map( ( _, index ) => (
							<li
								key={ index }
								className={ classnames( {
									[ `googlesitekit-setup-module--adsense__stage-indicator--current--${ mode }` ]:
										stage === index,
								} ) }
							/>
						) ) }
					</ul>
				</Cell>

				<Cell
					{ ...cellProps }
					smOrder={ 1 }
					mdOrder={ 2 }
					className="googlesitekit-setup-module--adsense__stage-images"
				>
					<div className="googlesitekit-setup-module--adsense__stage-image-container">
						{ stageContent.map( ( _, index ) => (
							<div
								key={ index }
								className={ classnames(
									'googlesitekit-setup-module--adsense__stage-image',
									{
										[ `googlesitekit-setup-module--adsense__stage-image--current--${ mode }` ]:
											stage === index,
									}
								) }
								onAnimationEnd={
									stage === index ? onAnimationEnd : undefined
								}
							>
								<ContentSVG stage={ index } />
							</div>
						) ) }
					</div>
				</Cell>
			</Row>
		</Fragment>
	);
} );

Content.propTypes = {
	stage: PropTypes.oneOf( [ 0, 1, 2 ] ),
	mode: PropTypes.oneOf( [ 'static', 'enter', 'leave' ] ),
	onAnimationEnd: PropTypes.func,
};

export default Content;
