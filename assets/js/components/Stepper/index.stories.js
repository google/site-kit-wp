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

function Template( { activeStep: initialActiveStep, variant } ) {
	const [ activeStep, setActiveStep ] = useState( initialActiveStep );

	if ( variant === 'rail' ) {
		return (
			<Stepper activeStep={ activeStep } variant={ variant }>
				<Step title="Connect publication" />
				<Step title="Add publication policies" />
				<Step title="Set up a sign-up form" />
				<Step title="Setup complete" />
			</Stepper>
		);
	}

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
Inactive.scenario = {};

export const FirstStepActive = Template.bind( {} );
FirstStepActive.storyName = 'First Step Active';
FirstStepActive.args = { activeStep: 0 };
FirstStepActive.scenario = {};

export const MiddleStepActive = Template.bind( {} );
MiddleStepActive.storyName = 'Middle Step Active';
MiddleStepActive.args = { activeStep: 1 };
MiddleStepActive.scenario = {};

export const LastStepActive = Template.bind( {} );
LastStepActive.storyName = 'Last Step Active';
LastStepActive.args = { activeStep: 2 };
LastStepActive.scenario = {};

export const Complete = Template.bind( {} );
Complete.storyName = 'Complete';
Complete.args = { activeStep: 3 };
Complete.scenario = {};

export const RailInactive = Template.bind( {} );
RailInactive.storyName = 'Rail Inactive';
RailInactive.args = { variant: 'rail' };
RailInactive.scenario = {};

export const RailFirstStepActive = Template.bind( {} );
RailFirstStepActive.storyName = 'Rail First Step Active';
RailFirstStepActive.args = { activeStep: 0, variant: 'rail' };
RailFirstStepActive.scenario = {};

export const RailMiddleStepActive = Template.bind( {} );
RailMiddleStepActive.storyName = 'Rail Middle Step Active';
RailMiddleStepActive.args = { activeStep: 1, variant: 'rail' };
RailMiddleStepActive.scenario = {};

export const RailLastStepActive = Template.bind( {} );
RailLastStepActive.storyName = 'Rail Last Step Active';
RailLastStepActive.args = { activeStep: 3, variant: 'rail' };
RailLastStepActive.scenario = {};

export const RailComplete = Template.bind( {} );
RailComplete.storyName = 'Rail Complete';
RailComplete.args = { activeStep: 4, variant: 'rail' };
RailComplete.scenario = {};

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
