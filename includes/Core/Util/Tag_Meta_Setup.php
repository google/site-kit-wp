<?php
/**
 * Class Google\Site_Kit\Core\Util\Tag_Meta_Setup.php
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Contracts\Registerable;

class Tag_Meta_Setup implements Registerable {

	use Templating;

	public function register() {
		// Output temporary tag if set.
		add_action( 'wp_head', [ $this, 'render_tag' ] );
	}

	public function render() {
		$token = get_transient( 'googlesitekit_setup_token' );

		if ( $token ) {
			$this->render( 'views/tag-meta-setup.php', [ 'content' => $token ] );
		}
	}
}
