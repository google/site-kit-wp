/**
 * ESLint rules: No Storybook Scenario Label
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

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow using label prop in Storybook stories scenario definitions.',
		},
		messages: {
			noLabelProp:
				"The label prop is not allowed on a Story's VRT scenario definition.",
		},
	},
	create( context ) {
		return {
			Property( node ) {
				if (
					context.getFilename().endsWith( '.stories.js' ) &&
					node.key.name === 'label' &&
					node.parent?.parent?.left?.property?.name === 'scenario' // This ensures that other label props such as in .args do not trigger this rule.
				) {
					context.report( {
						node,
						// eslint-disable-next-line sitekit/acronym-case
						messageId: 'noLabelProp',
					} );
				}
			},
		};
	},
};
