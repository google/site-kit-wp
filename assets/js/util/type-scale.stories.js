/**
 * Type Scale stories.
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
import Widget from '../googlesitekit/widgets/components/Widget';
import { Fragment } from '@wordpress/element';

function TypeScaleWidget( { name, label, sizes } ) {
	return (
		<Cell size={ 6 }>
			<Widget
				className={ `googlesitekit-type-scale googlesitekit-type-scale--${ name }` }
			>
				<h2>{ label }</h2>
				{ Object.keys( sizes ).map( ( key, index ) => {
					return (
						<p
							key={ index }
							className={ `googlesitekit-type-scale--${ name } ${ key }` }
						>
							{ sizes[ key ] }
						</p>
					);
				} ) }
			</Widget>
		</Cell>
	);
}

function Template() {
	return (
		<Fragment>
			<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
				<Row className="googlesitekit-widget-area-widgets">
					<Cell size={ 12 }>
						<h1>Type Scale</h1>
					</Cell>
					<TypeScaleWidget
						name="display"
						label="Display"
						sizes={ {
							lg: 'Large 58/64',
							md: 'Medium 46/52',
							sm: 'Small 38/44',
						} }
					/>
					<TypeScaleWidget
						name="headline"
						label="Headline"
						sizes={ {
							lg: 'Large 32/40',
							md: 'Medium 28/36',
							sm: 'Small 22/28',
						} }
					/>
					<TypeScaleWidget
						name="title"
						label="Title"
						sizes={ {
							lg: 'Large 18/24',
							md: 'Medium 16/20',
							sm: 'Small 14/16',
						} }
					/>
					<TypeScaleWidget
						name="label"
						label="Label"
						sizes={ {
							lg: 'Large 16/24',
							md: 'Medium 14/20',
							sm: 'Small 12/16',
						} }
					/>
					<TypeScaleWidget
						name="body"
						label="Body"
						sizes={ {
							lg: 'Large 16/24',
							md: 'Medium 14/20',
							sm: 'Small 12/16',
						} }
					/>
					<TypeScaleWidget
						name="link"
						label="Link"
						sizes={ {
							lg: 'Large 16/24',
							md: 'Medium 14/20',
							sm: 'Small 12/16',
						} }
					/>
				</Row>
			</Grid>
		</Fragment>
	);
}

export const DefaultTypeScale = Template.bind( {} );
DefaultTypeScale.scenario = {
	label: 'Global/TypeScale/Default Type Scale',
};

export default {
	title: 'Type Scale',
	decorators: [
		( Story ) => {
			return (
				<div className="googlesitekit-story--type-scale">
					<Story />
				</div>
			);
		},
	],
};
