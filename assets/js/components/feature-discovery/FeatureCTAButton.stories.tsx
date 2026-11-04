/**
 * FeatureCTAButton stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Story } from '@/js/types/Story';
import FeatureCTAButton, { FeatureCTAButtonProps } from './FeatureCTAButton';

interface StoryArgs extends FeatureCTAButtonProps {
	label: string;
}

function Template( { label, ...args }: StoryArgs ) {
	return <FeatureCTAButton { ...args }>{ label }</FeatureCTAButton>;
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = {
	label: 'Set up now',
};

export const Tertiary = Template.bind( {} ) as Story< StoryArgs >;
Tertiary.storyName = 'Tertiary';
Tertiary.args = {
	label: 'Set up now',
	isTertiary: true,
};

export const Busy = Template.bind( {} ) as Story< StoryArgs >;
Busy.storyName = 'Busy';
Busy.args = {
	label: 'Set up now',
	isBusy: true,
};

export const BusyTertiary = Template.bind( {} ) as Story< StoryArgs >;
BusyTertiary.storyName = 'Busy, Tertiary';
BusyTertiary.args = {
	label: 'Set up now',
	isBusy: true,
	isTertiary: true,
};

export default {
	title: 'Components/Feature Discovery/FeatureCTAButton',
	component: FeatureCTAButton,
};
