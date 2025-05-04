<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID;

/**
 * Class for the Reader Revenue Manager tag guard.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Post_Product_ID instance.
	 *
	 * @since 1.148.0
	 *
	 * @var Post_Product_ID
	 */
	private $post_product_id;

	/**
	 * Constructor.
	 *
	 * @since 1.148.0
	 *
	 * @param Module_Settings $settings Module settings instance.
	 * @param Post_Product_ID $post_product_id Post_Product_ID instance.
	 */
	public function __construct( Module_Settings $settings, $post_product_id ) {
		parent::__construct( $settings );

		$this->post_product_id = $post_product_id;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.132.0
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		$settings = $this->settings->get();

		if ( empty( $settings['publicationID'] ) ) {
			return false;
		}

		if ( is_singular() ) {
			return $this->can_activate_for_singular_post();
		}

		return 'sitewide' === $settings['snippetMode'];
	}

	/**
	 * Determines whether the guarded tag can be activated for a singular post or not.
	 *
	 * @since 1.148.0
	 *
	 * @return bool TRUE if guarded tag can be activated for a singular post, otherwise FALSE.
	 */
	private function can_activate_for_singular_post() {
		$post_product_id = $this->post_product_id->get( get_the_ID() );

		if ( 'none' === $post_product_id ) {
			return false;
		}

		if ( ! empty( $post_product_id ) ) {
			return true;
		}

		$settings = $this->settings->get();

		// If the snippet mode is `per_post` and there is no post product ID,
		// we don't want to render the tag.
		if ( 'per_post' === $settings['snippetMode'] ) {
			return false;
		}

		// If the snippet mode is `post_types`, we only want to render the tag
		// if the current post type is in the list of allowed post types.
		if ( 'post_types' === $settings['snippetMode'] ) {
			/**
			 * Filters the post types where Reader Revenue Manager CTAs should appear.
			 *
			 * @since 1.140.0
			 *
			 * @param array $cta_post_types The array of post types.
			 */
			$cta_post_types = apply_filters(
				'googlesitekit_reader_revenue_manager_cta_post_types',
				$settings['postTypes']
			);

			return in_array( get_post_type(), $cta_post_types, true );
		}

		// Snippet mode is `sitewide` at this point, so we want to render the tag.
		return true;
	}
}
