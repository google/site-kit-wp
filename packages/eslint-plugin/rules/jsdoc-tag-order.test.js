/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-tag-order';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-tag-order', rule, {
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
 * @param {?Function} props.callback Function which receives the registry instance.
 * @param {?Object}   props.registry Registry object; uses \`createTestRegistry()\` by default.
 * @return {string} A test string.
 */
export function WithTestRegistry( { children, callback, registry = createTestRegistry() } = {} ) {
	// Populate most basic data which should not affect any tests.
	provideUserInfo( registry );

	if ( callback ) {
		callback( registry );
	}

	return 'test';
}
      `,
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since n.e.x.t
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
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
 * @private
 * @since 1.7.1
 *
 * @param {?Object}   props          Component props.
 * @param {?Function} props.callback Function which receives the registry instance.
 * @param {?Object}   props.registry Registry object; uses \`createTestRegistry()\` by default.
 * @return {string} A test string.
 */
export function WithTestRegistry( { children, callback, registry = createTestRegistry() } = {} ) {
	// Populate most basic data which should not affect any tests.
	provideUserInfo( registry );

	if ( callback ) {
		callback( registry );
	}

	return 'test';
}
      `,
			errors: [
				{
					message:
						'The @since tag should be before @private tag.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 *
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
						'The @since tag should not have a newline between it and the following @private tag.',
				},
			],
		},
	],
} );
