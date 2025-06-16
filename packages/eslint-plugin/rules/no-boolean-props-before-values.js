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

				for (
					let attributeIndex = 0;
					attributeIndex < node.attributes.length;
					attributeIndex++
				) {
					const attribute = node.attributes[ attributeIndex ];

					if ( attribute.type !== 'JSXAttribute' ) {
						continue;
					}

					// If the attribute has no value, it's a boolean prop.
					if ( attribute.value === null ) {
						booleanProps.push( {
							attribute,
							index: attributeIndex,
						} );
						// If this is the first valued attribute, set the index.
					} else if ( firstValuedIndex === -1 ) {
						firstValuedIndex = attributeIndex;
					}
				}

				// If there are no boolean props or no valued props, there's nothing to do.
				if ( firstValuedIndex === -1 || booleanProps.length === 0 ) {
					return;
				}

				const misplacedBooleanProps = booleanProps.filter(
					( { index } ) => index < firstValuedIndex
				);

				if ( misplacedBooleanProps.length === 0 ) {
					return;
				}

				const fix = ( fixer ) => {
					const sourceCode = context.getSourceCode();

					const allBooleanAttributes = node.attributes.filter(
						( attribute ) =>
							attribute.type === 'JSXAttribute' &&
							attribute.value === null
					);

					const lastNonBooleanAttribute = [ ...node.attributes ]
						.reverse()
						.find(
							( attribute ) =>
								! (
									attribute.type === 'JSXAttribute' &&
									attribute.value === null
								)
						);

					const booleanPropsText = allBooleanAttributes
						.map( ( attribute ) => sourceCode.getText( attribute ) )
						.join( ' ' );

					// Create fixes to remove all boolean props from their original positions.
					const removeFixes = allBooleanAttributes.map( ( attr ) => {
						let [ removeStart, removeEnd ] = attr.range;
						const afterAttr = sourceCode.text.slice( removeEnd );
						const whitespaceMatch = afterAttr.match( /^\s+/ );
						if ( whitespaceMatch ) {
							removeEnd += whitespaceMatch[ 0 ].length;
						}
						return fixer.removeRange( [ removeStart, removeEnd ] );
					} );

					// Insert the boolean props after the last non-boolean attribute.
					const insertFix = fixer.insertTextAfter(
						lastNonBooleanAttribute,
						` ${ booleanPropsText }`
					);

					return [ ...removeFixes, insertFix ];
				};

				misplacedBooleanProps.forEach( ( { attribute }, index ) => {
					const report = {
						node: attribute,
						// eslint-disable-next-line sitekit/acronym-case
						messageId: 'booleanPropBeforeValue',
						data: {
							name: attribute.name.name,
						},
					};

					if ( index === 0 ) {
						report.fix = fix;
					}

					context.report( report );
				} );
			},
		};
	},
};
