/**
 * ESLint rules: No boolean props before values.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
				'Enforce that boolean props are placed after props with values in JSX elements',
		},
		fixable: 'code',
		messages: {
			booleanPropBeforeValue:
				'Boolean prop "{{name}}" should appear after props with values.',
		},
	},
	create( context ) {
		return {
			JSXOpeningElement( node ) {
				let firstValuedIndex = -1;
				const booleanProps = [];

				for ( let i = 0; i < node.attributes.length; i++ ) {
					const attribute = node.attributes[ i ];

					if ( attribute.type !== 'JSXAttribute' ) {
						continue;
					}

					// If the attribute has no value, it is a boolean prop.
					if ( attribute.value === null ) {
						booleanProps.push( { attribute, index: i } );
					} else {
						firstValuedIndex = i;
					}
				}

				for ( const { attribute, index } of booleanProps ) {
					if ( index < firstValuedIndex ) {
						context.report( {
							node: attribute,
							// eslint-disable-next-line sitekit/acronym-case
							messageId: 'booleanPropBeforeValue',
							data: {
								name: attribute.name.name,
							},
							fix( fixer ) {
								const sourceCode = context.getSourceCode();
								const booleanText =
									sourceCode.getText( attribute );

								// Find the range to remove: attribute + any trailing whitespace
								let [ removeStart, removeEnd ] =
									attribute.range;
								const afterAttr =
									sourceCode.text.slice( removeEnd );
								const whitespaceMatch =
									afterAttr.match( /^\s+/ );
								if ( whitespaceMatch ) {
									removeEnd += whitespaceMatch[ 0 ].length;
								}
								const removeFix = fixer.removeRange( [
									removeStart,
									removeEnd,
								] );

								const lastAttribute =
									node.attributes[
										node.attributes.length - 1
									];
								const insertIndex = lastAttribute.range[ 1 ];
								const insertFix = fixer.insertTextAfterRange(
									[ insertIndex, insertIndex ],
									` ${ booleanText }`
								);

								return [ removeFix, insertFix ];
							},
						} );
					}
				}
			},
		};
	},
};
