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
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for the Reader Revenue Manager tag guard.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Post product ID.
	 *
	 * @since n.e.x.t
	 *
	 * @var string
	 */
	private $post_product_id;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Module_Settings $settings Module settings instance.
	 * @param string          $post_product_id Post product ID.
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

		if ( Feature_Flags::enabled( 'rrmModuleV2' ) ) {
			if ( is_singular() ) {
				if ( 'none' === $this->post_product_id ) {
					return false;
				}

				if ( empty( $this->post_product_id ) ) {
					if ( 'per_post' === $settings['snippetMode'] ) {
						return false;
					}

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

					if (
						'post_types' === $settings['snippetMode'] &&
						! in_array( get_post_type(), $cta_post_types, true ) ) {
						return false;
					}
				}
			} elseif ( 'sitewide' !== $settings['snippetMode'] ) {
					return false;
			}
		}

		return true;
	}
}
