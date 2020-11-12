/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-tag-grouping';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-tag-grouping', rule, {
	valid: [
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
		},
	],
	invalid: [
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @private
 *
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'The @private tag should be followed by an empty line, and then by the @param tag.',
				},
			],
		},
	],
} );
