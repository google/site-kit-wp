/**
 * ActionButton stories.
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
import PlusCircle from '@/svg/icons/plus-circle.svg';
import ActionButton, { ActionButtonProps } from './ActionButton';

function Template( args: ActionButtonProps ) {
	return <ActionButton { ...args } />;
}

export const Default = Template.bind( {} ) as Story< ActionButtonProps >;
Default.args = { Icon: PlusCircle, label: 'Add question', iconSize: 24 };

export const Disabled = Template.bind( {} ) as Story< ActionButtonProps >;
Disabled.args = {
	...Default.args,
	disabled: true,
};

export const WithTooltip = Template.bind( {} ) as Story< ActionButtonProps >;
WithTooltip.args = { ...Default.args, tooltip: 'Add question' };

export default {
	title: 'Components/ActionButton',
	component: ActionButton,
};
