/**
 * Typography stories.
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
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../material-components';
import Widget from '../googlesitekit/widgets/components/Widget';
import Typography from './Typography';

function GroupWrapper( { size = 6, header, children } ) {
	return (
		<Cell size={ size }>
			<Widget
				Header={ () => <h2>{ header }</h2> }
				className="googlesitekit-typography-group"
			>
				{ children.map( ( child, index ) => (
					<div key={ index }>
						{ child }
						<br />
						<br />
					</div>
				) ) }
			</Widget>
		</Cell>
	);
}

function Template() {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 12 }>
					<h1>Typography</h1>
				</Cell>
				<GroupWrapper size={ 12 } header="Display">
					<Typography type="display" size="large">
						Display Large 58/64
					</Typography>
					<Typography type="display" size="medium">
						Display Medium 46/52
					</Typography>
					<Typography type="display" size="small">
						Display Small 38/44
					</Typography>
				</GroupWrapper>

				<GroupWrapper header="Headline">
					<Typography type="headline" size="large">
						Headline Large 32/40
					</Typography>
					<Typography type="headline" size="medium">
						Headline Medium 28/36
					</Typography>
					<Typography type="headline" size="small">
						Headline Small 22/28
					</Typography>
				</GroupWrapper>

				<GroupWrapper header="Title">
					<Typography type="title" size="large">
						Title Large 18/24
					</Typography>
					<Typography type="title" size="medium">
						Title Medium 16/20
					</Typography>
					<Typography type="title" size="small">
						Title Small 14/16
					</Typography>
				</GroupWrapper>

				<GroupWrapper header="Label">
					<Typography type="label" size="large">
						Label Large 16/24
					</Typography>
					<Typography type="label" size="medium">
						Label Medium 14/20
					</Typography>
					<Typography type="label" size="small">
						Label Small 12/16
					</Typography>
				</GroupWrapper>

				<GroupWrapper header="Body">
					<Typography type="body" size="large">
						Body Large 16/24
					</Typography>
					<Typography type="body" size="medium">
						Body Medium 14/20
					</Typography>
					<Typography type="body" size="small">
						Body Small 12/16
					</Typography>
				</GroupWrapper>
			</Row>
		</Grid>
	);
}

export const DefaultTypography = Template.bind( {} );

export default {
	title: 'Typography',
	decorators: [
		( Story ) => {
			return (
				<div className="googlesitekit-story--typography">
					<Story />
				</div>
			);
		},
	],
};
