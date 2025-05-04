/**
 * Color Tokens stories.
 *
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
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../material-components';
import { Fragment } from '@wordpress/element';

function TokenRow( { children } ) {
	return <div className="googlesitekit-color-token-row">{ children }</div>;
}
function TokenColumn( { children } ) {
	return <div className="googlesitekit-color-token-column">{ children }</div>;
}

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

function SurfacesTokens() {
	return (
		<Fragment>
			<h2>Surfaces</h2>
			<TokenRow>
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
			</TokenRow>
			<Token
				name="surfaces-background"
				label="Background"
				reference="N-10"
			/>
			<TokenRow>
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
			</TokenRow>
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
			<TokenRow>
				<Token
					name="surfaces-inverse-on-surface"
					label="Inverse On Surface"
					reference="N-50"
				/>
				<Token
					name="surfaces-inverse-surface"
					label="Inverse Surface"
					reference="N-900"
				/>
			</TokenRow>
		</Fragment>
	);
}

function ContentTokens() {
	return (
		<Fragment>
			<h2>Content</h2>
			<TokenRow>
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
			</TokenRow>
			<TokenRow>
				<Token
					name="content-primary-container"
					label="Primary Container"
					reference="SK-100"
				/>
				<Token
					name="content-primary"
					label="Primary"
					reference="SK-500"
				/>
			</TokenRow>
			<TokenRow>
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
			</TokenRow>
			<TokenRow>
				<Token
					name="content-secondary-container"
					label="Secondary Container"
					reference="T-50"
				/>
				<Token
					name="content-secondary"
					label="Secondary"
					reference="T-500"
				/>
			</TokenRow>
		</Fragment>
	);
}

function InteractiveTokens() {
	return (
		<Fragment>
			<h2>Interactive</h2>
			<TokenRow>
				<TokenColumn>
					<Token
						name="interactive-primary-hover"
						label="Primary Hover"
						reference="00220D, 24%"
					/>
					<Token
						name="interactive-primary-focus"
						label="Primary Focus"
						reference="00220D, 48%"
					/>
					<Token
						name="interactive-primary-press"
						label="Primary Press"
						reference="00220D, 32%"
					/>
				</TokenColumn>
				<TokenColumn>
					<Token
						name="interactive-secondary-hover"
						label="Secondary Hover"
						reference="161B18, 16%"
					/>
					<Token
						name="interactive-secondary-focus"
						label="Secondary Focus"
						reference="161B18, 36%"
					/>
					<Token
						name="interactive-secondary-press"
						label="Secondary Press"
						reference="161B18, 24%"
					/>
				</TokenColumn>
				<TokenColumn>
					<Token
						name="interactive-tertiary-hover"
						label="Tertiary Hover"
						reference="161B18, 8%"
					/>
					<Token
						name="interactive-tertiary-focus"
						label="Tertiary Focus"
						reference="161B18, 26%"
					/>
					<Token
						name="interactive-tertiary-press"
						label="Tertiary Press"
						reference="161B18, 16%"
					/>
				</TokenColumn>
			</TokenRow>
			<TokenRow>
				<TokenColumn>
					<Token
						name="interactive-on-disable-container"
						label="On Disabled"
						reference="#030E07, 0.32"
					/>
					<Token
						name="interactive-disable-container"
						label="Disabled"
						reference="#082A41, 0.08"
					/>
					<Token
						name="interactive-inverse-on-disable-container"
						label="Inverse On Disabled"
						reference="#FFFFFF, 0.40"
					/>
					<Token
						name="interactive-inverse-disable-container"
						label="Inverse Disabled"
						reference="#FFFFFF, 0.12"
					/>
				</TokenColumn>
				<TokenColumn>
					<Token
						name="interactive-focus"
						label="Focus"
						reference="N-1000"
					/>
					<Token
						name="interactive-inverse-focus"
						label="Inverse Focus"
						reference="N-0"
					/>
				</TokenColumn>
			</TokenRow>
		</Fragment>
	);
}

function UtilityTokens() {
	return (
		<Fragment>
			<h2>Utility</h2>
			<TokenRow>
				<TokenColumn>
					<Token
						name="utility-on-error"
						label="On Error"
						reference="R-0"
					/>
					<Token
						name="utility-error"
						label="Error"
						reference="R-500"
					/>
					<Token
						name="utility-on-error-container"
						label="On Error Container"
						reference="R-700"
					/>
					<Token
						name="utility-error-container"
						label="Error Container"
						reference="R-50"
					/>
				</TokenColumn>
				<TokenColumn>
					<Token
						name="utility-on-success"
						label="On Success"
						reference="G-0"
					/>
					<Token
						name="utility-success"
						label="Success"
						reference="G-500"
					/>
					<Token
						name="utility-on-success-container"
						label="On Success Container"
						reference="G-700"
					/>
					<Token
						name="utility-success-container"
						label="Success Container"
						reference="G-50"
					/>
				</TokenColumn>
				<TokenColumn>
					<Token
						name="utility-on-warning"
						label="On Warning"
						reference="Y-0"
					/>
					<Token
						name="utility-warning"
						label="Warning"
						reference="Y-500"
					/>
					<Token
						name="utility-on-warning-container"
						label="On Warning Container"
						reference="Y-700"
					/>
					<Token
						name="utility-warning-container"
						label="Warning Container"
						reference="Y-50"
					/>
				</TokenColumn>
			</TokenRow>
		</Fragment>
	);
}

function Template() {
	return (
		<Fragment>
			<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
				<Row className="googlesitekit-widget-area-widgets">
					<Cell size={ 12 }>
						<h1>Tokens</h1>
					</Cell>
					<Cell size={ 6 }>
						<SurfacesTokens />
					</Cell>
					<Cell size={ 6 }>
						<ContentTokens />
					</Cell>

					<Cell size={ 6 }>
						<InteractiveTokens />
					</Cell>
					<Cell size={ 6 }>
						<UtilityTokens />
					</Cell>
				</Row>
			</Grid>
		</Fragment>
	);
}

export const DefaultToken = Template.bind( {} );
DefaultToken.scenario = {
	label: 'Global Tokens/undefined',
};

export default {
	title: 'Color Palette (tokens)',
	decorators: [
		( Story ) => {
			return (
				<div className="googlesitekit-story--tokens">
					<Story />
				</div>
			);
		},
	],
};
