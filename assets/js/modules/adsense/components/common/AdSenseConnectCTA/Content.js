/**
 * AdSenseConnectCTA > Connect component.
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

/**
 * Internal dependencies
 */
import { Grid, Row, Cell } from '../../../../../material-components';
import AdSenseIcon from '../../../../../../svg/graphics/adsense.svg';
import ContentSVG from './ContentSVG';

export default function Content( { stage } ) {
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
		<Grid>
			<Row>
				<Cell { ...cellProps }>
					<p className="googlesitekit-setup__intro-title">
						{ __( 'Connect', 'google-site-kit' ) }
					</p>
					<div className="googlesitekit-setup-module">
						<div className="googlesitekit-setup-module__logo">
							<AdSenseIcon width="33" height="33" />
						</div>

						<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
							{ _x(
								'AdSense',
								'Service name',
								'google-site-kit'
							) }
						</h2>

						<ul>
							{ stageContent.map(
								( { title, description }, index ) => (
									<li
										key={ index }
										className={ classnames(
											'googlesitekit-setup-module--adsense__stage',
											{
												'googlesitekit-setup-module--adsense__stage--current':
													stage === index,
											}
										) }
									>
										<h4>{ title }</h4>
										<p>{ description }</p>
									</li>
								)
							) }
						</ul>
					</div>
				</Cell>
				<Cell
					{ ...cellProps }
					className="googlesitekit-setup-module--adsense__stage-image"
				>
					<ContentSVG stage={ stage } />
				</Cell>
			</Row>
		</Grid>
	);
}

Content.propTypes = {
	stage: PropTypes.oneOf( [ 0, 1, 2 ] ),
};
