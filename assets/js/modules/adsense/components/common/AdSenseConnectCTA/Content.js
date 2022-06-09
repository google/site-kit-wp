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
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Cell } from '../../../../../material-components';
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
		<Fragment>
			<Cell
				{ ...cellProps }
				smOrder={ 2 }
				mdOrder={ 1 }
				className="googlesitekit-setup-module--adsense__stage-text"
			>
				<ul>
					{ stageContent.map( ( { title, description }, index ) => (
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
					) ) }
				</ul>
				<ul className="googlesitekit-setup-module--adsense__stage-indicator">
					{ stageContent.map( ( _, index ) => (
						<li
							key={ index }
							className={ classnames( {
								'googlesitekit-setup-module--adsense__stage-indicator--current':
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
				className="googlesitekit-setup-module--adsense__stage-image"
			>
				<ContentSVG stage={ stage } />
			</Cell>
		</Fragment>
	);
}

Content.propTypes = {
	stage: PropTypes.oneOf( [ 0, 1, 2 ] ),
};
