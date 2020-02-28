/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

const siteKitRegistry = createRegistry();

export const { registerStore } = siteKitRegistry;

export default siteKitRegistry;
