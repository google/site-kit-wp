/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-fullstop';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-fullstop', rule, {
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
 * @deprecated Use another function instead
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
						'The description for `@deprecated Use another function instead` should end with a period/full-stop.',
				},
			],
		},
	],
} );
