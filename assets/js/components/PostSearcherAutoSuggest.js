/**
 * PostSearcherAutoSuggest component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * External dependencies
 */
import {
	Combobox,
	ComboboxInput,
	ComboboxPopover,
	ComboboxList,
	ComboboxOption,
} from '@reach/combobox';
const PostSearcherAutoSuggest = () => {
	return (
		<div>
			<h4 id="demo">Basic, Fixed List Combobox</h4>
			<Combobox aria-labelledby="demo">
				<ComboboxInput />
				<ComboboxPopover portal={ false }>
					<ComboboxList>
						<ComboboxOption value="Apple" />
						<ComboboxOption value="Banana" />
						<ComboboxOption value="Orange" />
						<ComboboxOption value="Pineapple" />
						<ComboboxOption value="Kiwi" />
					</ComboboxList>
				</ComboboxPopover>
			</Combobox>
		</div>
	);
};

export default PostSearcherAutoSuggest;
