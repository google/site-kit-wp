<?php
/**
 * Test functions.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

/**
 * Create a WP post.
 *
 * @param array $post_args
 * @param array $post_meta
 * @param int $site_id
 *
 * @since 1.0
 * @return int|WP_Error
 */
function googlesitekit_create_post( $post_args = array(), $post_meta = array(), $site_id = null ) {
	if ( null !== $site_id ) {
		switch_to_blog( $site_id );
	}

	$args = array(
		'post_status' => 'publish',
		'post_title'  => 'Test Post ' . time(),
		'post_type'   => 'post',
	);

	$args = wp_parse_args( $post_args, $args );

	$post_id = wp_insert_post( $args );

	// Quit if we have a WP_Error object.
	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	if ( ! empty( $post_meta ) ) {
		foreach ( $post_meta as $key => $value ) {
			// No need for sanitization here.
			update_post_meta( $post_id, $key, $value );
		}
	}

	if ( null !== $site_id ) {
		restore_current_blog();
	}

	return $post_id;
}

/**
 * Takes a snapshot of an array of WP_Hooks.
 *
 * @since n.e.x.t
 *
 * @param WP_Hook[] $hooks The hooks to snapshot. Defaults to the global hooks instance.
 * @return WP_Hook[]
 */
function tests_snapshot_hooks( array $hooks = null ) {
	if ( null === $hooks ) {
		$hooks = $GLOBALS['wp_filter'];
	}
	return array_map(
		function ( WP_Hook $wp_hook ) {
			return clone $wp_hook;
		},
		$hooks
	);
}

