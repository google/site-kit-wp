/**
 * Type Scale stories.
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
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../assets/js/material-components';
import { Fragment } from '@wordpress/element';

import './tokens.scss';

function Token( { name, label, reference } ) {
	return (
		<div
			className={ `googlesitekit-color-token googlesitekit-color-token--${ name }` }
		>
			<p className="googlesitekit-color-token--label">{ label }</p>
			<p className="googlesitekit-color-token--reference">
				{ reference }
			</p>
		</div>
	);
}

const Template = () => (
	<Fragment>
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 6 }>
					<h1>Tokens</h1>

					<Token
						name="surfaces-on-background"
						label="On Background"
						reference="N-900"
					/>
					<Token
						name="surfaces-on-background-variant"
						label="On Background Variant"
						reference="N-500"
					/>
					<Token
						name="surfaces-background"
						label="Background"
						reference="N-10"
					/>
					<Token
						name="surfaces-on-surface"
						label="On Surface"
						reference="N-900"
					/>
					<Token
						name="surfaces-on-surface-variant"
						label="On Surface Variant"
						reference="N-500"
					/>
					<Token
						name="surfaces-surface"
						label="Surface (0)"
						reference="N-0"
					/>
					<Token
						name="surfaces-surface-1"
						label="Surface 1"
						reference="N-50"
					/>
					<Token
						name="surfaces-surface-2"
						label="Surface 2"
						reference="N-100"
					/>
					<Token
						name="surfaces-inverse-surface"
						label="Inverse Surface"
						reference="N-900"
					/>

					<h2>Primary</h2>
					<h3>Content</h3>
					<Token
						name="content-on-primary-container"
						label="On Primary Container"
						reference="SK-600"
					/>
					<Token
						name="content-on-primary"
						label="On Primary"
						reference="SK-0"
					/>
					<Token
						name="content-primary-container"
						label="Primary Container"
						reference="SK-100"
					/>
					<Token
						name="content-primary"
						label="Primary"
						reference="SK-600"
					/>

					<h3>Secondary</h3>
					<Token
						name="content-on-secondary-container"
						label="On Secondary Container"
						reference="T-600"
					/>
					<Token
						name="content-on-secondary"
						label="On Secondary"
						reference="T-0"
					/>
					<Token
						name="content-secondary-container"
						label="Secondary Container"
						reference="T-50"
					/>
					<Token
						name="content-secondary"
						label="Secondary"
						reference="SK-600"
					/>
				</Cell>
			</Row>
		</Grid>
	</Fragment>
);

export const DefaultToken = Template.bind( {} );

export default {
	title: 'Global/Tokens',
	// decorators: [
	// 	( Story ) =>
	// 		return (
	// 				<Story />
	// 		);
	// 	},
	// ],
};
