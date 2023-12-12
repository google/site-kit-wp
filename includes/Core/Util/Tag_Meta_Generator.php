<?php
/**
 * Class Google\Site_Kit\Core\Util\Tag_Meta_Generator.php
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Contracts\Registerable;

class Tag_Meta_Generator implements Registerable {

	use Templating;

	public function register() {
		add_action( 'wp_head', [ $this, 'display' ] );
		add_action( 'login_head', [ $this, 'display' ] );
	}

	public function display() {
		$content = sprintf( 'Site Kit by Google %s', GOOGLESITEKIT_VERSION );
		$this->render( 'views/tag-meta-generator.php', compact( 'content' ));
	}
}
