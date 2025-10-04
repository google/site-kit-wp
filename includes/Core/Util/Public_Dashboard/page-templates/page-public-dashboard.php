<?php
/**
 * Template Name: Site Kit Public Dashboard
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Load necessary WordPress core files and functions.
require_once ABSPATH . 'wp-load.php';
require_once ABSPATH . WPINC . '/template-loader.php';

// Output the necessary parts of the header.
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<div id="content">

<div class="googlesitekit-plugin">
	<div id="js-googlesitekit-public-dashboard" data-view-only="true"></div>
</div>

<?php
// Output the necessary parts of the footer.
?>
</div> <!-- End of #content -->
<?php wp_footer(); ?>
</body>
</html>
