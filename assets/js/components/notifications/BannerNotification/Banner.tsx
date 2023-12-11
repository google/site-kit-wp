/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, forwardRef } from '@wordpress/element';

/*
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../material-components';
import { BannerProps } from './types';

// eslint-disable-next-line sitekit/acronym-case
const Banner = forwardRef< HTMLElement, BannerProps >(
	( { id, className, children, secondaryPane }, ref ) => (
		<section
			id={ id }
			className={ classnames( className, 'googlesitekit-publisher-win' ) }
			ref={ ref }
		>
			<Grid>
				<Row>{ children }</Row>
			</Grid>

			{ secondaryPane && (
				<Fragment>
					<div className="googlesitekit-publisher-win__secondary-pane-divider" />
					<Grid className="googlesitekit-publisher-win__secondary-pane">
						<Row>
							<Cell
								className="googlesitekit-publisher-win__secondary-pane"
								size={ 12 }
							>
								{ secondaryPane }
							</Cell>
						</Row>
					</Grid>
				</Fragment>
			) }
		</section>
	)
);

Banner.displayName = 'Banner';

export default Banner;
