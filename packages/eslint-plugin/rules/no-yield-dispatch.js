/**
 * ESLint rules: No yield dispatch.
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

module.exports = {
	create( context ) {
		return {
			YieldExpression( node ) {
				if (
					node.argument &&
					node.argument.type === 'CallExpression'
				) {
					const callee = node.argument.callee;

					// Checking for 'yield dispatch'
					if ( callee.name === 'dispatch' ) {
						context.report( {
							node,
							message: "Using 'yield dispatch' is disallowed.",
						} );
					}

					// Checking for 'yield registry.dispatch'
					if ( callee.type === 'MemberExpression' ) {
						if (
							callee.object.name === 'registry' &&
							callee.property.name === 'dispatch'
						) {
							context.report( {
								node,
								message:
									"Using 'yield registry.dispatch' is disallowed.",
							} );
						}
					}
				}
			},
		};
	},
};
