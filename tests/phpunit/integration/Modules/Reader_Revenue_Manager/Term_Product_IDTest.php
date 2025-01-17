<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Term_Product_ID_Test
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Storage\Term_Meta;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Term_Product_ID;
use Google\Site_Kit\Tests\TestCase;

class Term_Product_ID_Test extends TestCase {

	/**
	 * @var Term_Product_ID
	 */
	private $setting;

	public function set_up(): void {
		parent::set_up();

		$term_meta     = new Term_Meta();
		$this->setting = new Term_Product_ID( $term_meta, 'test_publication_id' );
		$this->setting->register();
	}

	public function test_product_id_meta_registered() {
		$registered = registered_meta_key_exists( 'term', 'googlesitekit_rrm_test_publication_id:productID' );

		$this->assertTrue( $registered );
	}

	public function test_show_in_rest() {
		$meta_key     = 'googlesitekit_rrm_test_publication_id:productID';
		$show_in_rest = get_registered_meta_keys( 'term' )[ $meta_key ]['show_in_rest'];

		$this->assertTrue( $show_in_rest );
	}
}
