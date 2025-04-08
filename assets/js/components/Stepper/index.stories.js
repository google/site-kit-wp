/**
 * Stepper component stories.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Step from './Step';
import Stepper from '.';

function Template( { activeStep: initialActiveStep } ) {
	const [ activeStep, setActiveStep ] = useState( initialActiveStep );

	return (
		<Stepper activeStep={ activeStep }>
			<Step title="First Step">
				<p>This is the first step.</p>
				<Button onClick={ () => setActiveStep( 1 ) }>Next</Button>
			</Step>
			<Step title="Middle Step">
				<p>This is the middle step.</p>
				<Button onClick={ () => setActiveStep( 2 ) }>Next</Button>
				<Button onClick={ () => setActiveStep( 0 ) }>Prev</Button>
			</Step>
			<Step title="Last Step">
				<p>This is the last step.</p>
				<Button onClick={ () => setActiveStep( 3 ) }>Done</Button>
				<Button onClick={ () => setActiveStep( 1 ) }>Prev</Button>
			</Step>
		</Stepper>
	);
}

export const Inactive = Template.bind( {} );
Inactive.storyName = 'Inactive';

export const FirstStepActive = Template.bind( {} );
FirstStepActive.storyName = 'First Step Active';
FirstStepActive.args = { activeStep: 0 };

export const MiddleStepActive = Template.bind( {} );
MiddleStepActive.storyName = 'Middle Step Active';
MiddleStepActive.args = { activeStep: 1 };

export const LastStepActive = Template.bind( {} );
LastStepActive.storyName = 'Last Step Active';
LastStepActive.args = { activeStep: 2 };

export const Complete = Template.bind( {} );
Complete.storyName = 'Complete';
Complete.args = { activeStep: 3 };

export default {
	title: 'Components/Stepper',
	component: Stepper,
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
	],
};
