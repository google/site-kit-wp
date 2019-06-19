<?php
/**
 * Test functions.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
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
