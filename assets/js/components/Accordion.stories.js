/**
 * Accordion Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import Accordion from './Accordion';

function Template() {
	return (
		<div className="js">
			<Accordion title="First" initialOpen>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
				vestibulum varius felis, in eleifend eros. Duis vel dolor
				sagittis, tincidunt sapien at, sagittis sem.
			</Accordion>
			<Accordion title="Second">
				Fusce pretium ac eros vel sollicitudin. Nulla commodo suscipit
				quam vel feugiat. Donec dictum sodales justo, id malesuada
				tortor euismod bibendum.
			</Accordion>
			<Accordion title="Third">
				Morbi sollicitudin suscipit erat, vel ullamcorper erat tincidunt
				et. Nulla vel efficitur sapien. Phasellus facilisis, augue id
				rhoncus cursus, dolor mauris porta arcu, vel volutpat urna ipsum
				non purus.
			</Accordion>
			<Accordion title="Fourth">
				Quisque lacus magna, congue eu purus vitae, tristique molestie
				magna. Ut in elit erat. Ut a libero in ante ultricies efficitur.
				Quisque laoreet semper magna ac mollis.
			</Accordion>
			<Accordion title="Disabled" disabled>
				Fusce sit amet tellus neque. Praesent egestas dapibus ipsum vel
				vulputate. Nunc massa ante, interdum eget semper nec, malesuada
				congue neque. Vestibulum ante ipsum primis in faucibus.
			</Accordion>
		</div>
	);
}

export const DefaultAccordion = Template.bind( {} );
DefaultAccordion.storyName = 'Accordion';

export default {
	title: 'Components/Accordion',
	component: Accordion,
};
