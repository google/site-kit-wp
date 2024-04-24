<?php
/**
 * Trait Google\Site_Kit\Core\Tags\Tag_With_Linker_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Trait for adding the linker property with domain to tag output.
 *
 * @since 1.125.0
 * @access private
 * @ignore
 */
trait Tag_With_Linker_Trait {
	/**
	 * Holds the value of the domain for the linker config option in the gtag.
	 *
	 * @var string $home_domain The site's domain for linker property.
	 */
	private $home_domain;

	/**
	 * Method to set home domain.
	 *
	 * @param string $home_domain The value to set for home domain.
	 *
	 * @since 1.125.0
	 * @return void
	 */
	public function set_home_domain( $home_domain ) {
		$this->home_domain = $home_domain;
	}

	/**
	 * Method to add linker domain to tag config.
	 *
	 * @param array $tag_config Tag config to add linker entry to.
	 *
	 * @since 1.125.0
	 * @return array Tag config, with or without linker values.
	 */
	protected function add_linker_to_tag_config( $tag_config ) {
		return array_merge( $tag_config, array( 'linker' => array( 'domains' => array( $this->home_domain ) ) ) );
	}
}
