/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-capitalization';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-capitalization', rule, {
	valid: [
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @deprecated Use another function instead.
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
 * @deprecated use another function instead.
 * @private
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
						'The description for `@deprecated use another function instead.` should start with a capital letter.',
				},
			],
		},
	],
} );
