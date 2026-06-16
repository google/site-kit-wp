/**
 * LegacySplashViewOnlyContent component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Link from '@/js/components/Link';
import OptIn from '@/js/components/OptIn';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import { Cell, Row } from '@/js/material-components';
import SideKickSVG from '@/svg/graphics/view-only-setup-sidekick.svg';

export default function LegacySplashViewOnlyContent( {
	documentationURL,
	onButtonClick,
} ) {
	return (
		<Row className="googlesitekit-setup__content">
			<Cell
				smSize={ 4 }
				mdSize={ 8 }
				lgSize={ 4 }
				lgOrder={ 2 }
				className="googlesitekit-setup__icon"
			>
				<SideKickSVG width={ 398 } height={ 280 } />
			</Cell>
			<Cell smSize={ 4 } mdSize={ 8 } lgSize={ 8 } lgOrder={ 1 }>
				<Typography
					as="h1"
					className="googlesitekit-setup__title"
					size="large"
					type="headline"
				>
					{ __( 'View-only Dashboard Access', 'google-site-kit' ) }
				</Typography>
				<p className="googlesitekit-setup__description">
					{ createInterpolateElement(
						__(
							"An administrator has granted you access to view this site's dashboard to view stats from all shared Google services. <a>Learn more</a>",
							'google-site-kit'
						),
						{
							a: (
								<Link
									aria-label={ __(
										'Learn more about dashboard sharing',
										'google-site-kit'
									) }
									href={ documentationURL }
									external
								/>
							),
						}
					) }
				</p>
				<P>
					{ __(
						'Get insights about how people find and use your site as well as how to improve and monetize your content, directly in your WordPress dashboard',
						'google-site-kit'
					) }
				</P>

				<OptIn />

				<div className="googlesitekit-start-setup-wrap">
					<Button onClick={ onButtonClick }>
						{ __( 'Go to dashboard', 'google-site-kit' ) }
					</Button>
				</div>
			</Cell>
		</Row>
	);
}

LegacySplashViewOnlyContent.propTypes = {
	documentationURL: PropTypes.string,
	onButtonClick: PropTypes.func.isRequired,
};
