/**
 * Mock component utils.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Creates a mock component with a given name. The component will render the name and JSON stringified props passed to it.
 * The function is prefixed `mock` to allow usage with `jest.mock`. In general we should try to avoid mocking components,
 * but on the odd occasion that it's necessary this function can be used to create them.
 *
 * @since 1.46.0
 *
 * @param {string} name The name of the component.
 * @return {WPElement} The mock component.
 */
export function mockCreateComponent( name ) {
	return function ( { children, ...props } ) {
		return (
			<div>
				{ name }
				{ JSON.stringify( props ) }
				{ children }
			</div>
		);
	};
}
