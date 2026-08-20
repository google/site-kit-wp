/**
 * Logo Component Stories.
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
import Logo from './Logo';

interface LogoStoryProps {
	/**
	 * Class name for the element wrapping the logo. The class decides whether the
	 * Site Kit logo or the Google "G" shows.
	 */
	className?: string;
}

function Template( { className }: LogoStoryProps ) {
	return (
		<div className={ className }>
			<Logo />
		</div>
	);
}

/**
 * Backstop's smallest capture is 420px, and the style sheet hides the Site Kit
 * logo under 450px. This one story also catches the Google "G" alone.
 */
export const Default = Template.bind( {} ) as Story< LogoStoryProps >;
Default.storyName = 'Default';
Default.scenario = {};

export const SetupFlow = Template.bind( {} ) as Story< LogoStoryProps >;
SetupFlow.storyName = 'Setup Flow';
SetupFlow.args = {
	className: 'googlesitekit-setup-flow',
};
SetupFlow.scenario = {};

export const SetupSplash = Template.bind( {} ) as Story< LogoStoryProps >;
SetupSplash.storyName = 'Setup Splash';
SetupSplash.args = {
	className: 'googlesitekit-setup-splash',
};
SetupSplash.scenario = {};

export default {
	title: 'Components/Logo',
	component: Logo,
};
