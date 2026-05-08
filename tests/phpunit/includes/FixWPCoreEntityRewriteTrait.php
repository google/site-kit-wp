<?php
/**
 * FixWPCoreEntityRewriteTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use WP_Post_Type;
use WP_Taxonomy;

trait FixWPCoreEntityRewriteTrait {

	/**
	 * Fixes a post type's `$rewrite` property on demand.
	 *
	 * When a post type is registered, its `$rewrite` property is only sanitized if pretty permalinks are enabled.
	 * In order to switch the permalink structure around during tests and still have a proper `$rewrite` property for
	 * existing post types, we need to manually fix this.
	 *
	 * See https://core.trac.wordpress.org/ticket/50877 for upstream ticket.
	 *
	 * @param WP_Post_Type $post_type Post type object.
	 */
	private static function fix_post_type_rewrite( WP_Post_Type $post_type ) {
		if ( false === $post_type->rewrite ) {
			return;
		}

		$rewrite = $post_type->rewrite;

		// This code is copied from `WP_Post_Type::set_props()`.
		if ( ! is_array( $rewrite ) ) {
			$rewrite = array();
		}
		if ( empty( $rewrite['slug'] ) ) {
			$rewrite['slug'] = $post_type->name;
		}
		if ( ! isset( $rewrite['with_front'] ) ) {
			$rewrite['with_front'] = true;
		}
		if ( ! isset( $rewrite['pages'] ) ) {
			$rewrite['pages'] = true;
		}
		if ( ! isset( $rewrite['feeds'] ) || ! $post_type->has_archive ) {
			$rewrite['feeds'] = (bool) $post_type->has_archive;
		}
		if ( ! isset( $rewrite['ep_mask'] ) ) {
			if ( isset( $post_type->permalink_epmask ) ) {
				$rewrite['ep_mask'] = $post_type->permalink_epmask;
			} else {
				$rewrite['ep_mask'] = EP_PERMALINK;
			}
		}

		$post_type->rewrite = $rewrite;
	}

	/**
	 * Fixes a taxonomy's `$rewrite` property on demand.
	 *
	 * When a taxonomy is registered, its `$rewrite` property is only sanitized if pretty permalinks are enabled.
	 * In order to switch the permalink structure around during tests and still have a proper `$rewrite` property for
	 * existing taxonomies, we need to manually fix this.
	 *
	 * See https://core.trac.wordpress.org/ticket/50877 for upstream ticket.
	 *
	 * @param WP_Taxonomy $taxonomy Taxonomy object.
	 */
	private static function fix_taxonomy_rewrite( WP_Taxonomy $taxonomy ) {
		if ( false === $taxonomy->rewrite ) {
			return;
		}

		$rewrite = $taxonomy->rewrite;

		// This code is copied from `WP_Taxonomy::set_props()`.
		$rewrite = wp_parse_args(
			$rewrite,
			array(
				'with_front'   => true,
				'hierarchical' => false,
				'ep_mask'      => EP_NONE,
			)
		);
		if ( empty( $rewrite['slug'] ) ) {
			$rewrite['slug'] = sanitize_title_with_dashes( $taxonomy->name );
		}

		$taxonomy->rewrite = $rewrite;
	}
}
