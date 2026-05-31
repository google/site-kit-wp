/**
 * ESLint rules: No Children Prop Type
 *
 * Warn when a component's props explicitly type the `children` prop (e.g.
 * `children: ReactNode`). React's `FC`, which should always be used for
 * components, already includes the `children` prop, so it's at best
 * redundant but at worst overly restrictive, eg. when `children` are
 * typed as a _required_ prop.
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

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Disallow explicitly typing the `children` prop. Typing a component as `FC`, `ForwardRefExoticComponent`, etc. will automatically include the `children` prop.',
		},
		schema: [],
		messages: {
			noChildrenPropType:
				'Do not explicitly type the `children` prop. Your component should be typed as `FC`, `ForwardRefExoticComponent`, etc. thus should not need an explicit `children` prop type.',
		},
	},

	create( context ) {
		return {
			TSPropertySignature( node ) {
				const key = node.key;
				const isChildrenKey =
					( key?.type === 'Identifier' && key.name === 'children' ) ||
					( key?.type === 'Literal' && key.value === 'children' );

				if ( isChildrenKey && node.typeAnnotation ) {
					context.report( {
						node,
						// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
						messageId: 'noChildrenPropType',
					} );
				}
			},
		};
	},
};
