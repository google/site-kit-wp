# Sign in with Google for Third-Party Plugins & Themes

Starting from **Site Kit 1.164.0 or later**, Site Kit supports rendering a Sign in with Google button using [WordPress PHP actions](https://developer.wordpress.org/plugins/hooks/actions/) and [WordPress shortcodes](https://codex.wordpress.org/Shortcode).

Use this documentation to integrate the Sign in with Google button provided by Site Kit into your WordPress plugin, theme, or site code directly.

## Overview

Site Kit provides a PHP action, Gutenberg block, and a shortcode that allow third-party plugins and themes to render a Sign in with Google button anywhere on their site. Use this action or shortcode anywhere on your site to create a Sign in with Google button with no other code needed.

**Important:** You should always use the provided PHP action or shortcode rather than attempting to replicate the HTML output, as the implementation may change in future versions of Site Kit.

## Use Cases

The Sign in with Google action and shortcode are ideal for:

- Adding Google authentication to custom login forms
- Integrating Google Sign-In into membership plugins
- Providing alternative authentication methods in custom user interfaces
- Enhancing WooCommerce or other e-commerce login experiences
- Embedding the button in page content, widgets, or page builders (using the shortcode)

## PHP WordPress Action Hook

```php
do_action( 'googlesitekit_render_sign_in_with_google_button', array() );
```

**Parameters:**

The action accepts an optional `array` of the following parameters as its only argument:

| Argument | Type | Description | Values |
|----------|------|-------------|---------|
| `class` | `string` or `array` | Additional CSS classes to add to the button container (`'googlesitekit-sign-in-with-google__frontend-output-button'` is always present and cannot be removed.) | `string` or `array` of `string` |
| `text` | `string` | Button text variation | `'continue_with'`, `'signin'`, `'signin_with'`, `'signup_with'` |
| `theme` | `string` | Button color theme | `'outline'` (light), `'filled_blue'` (neutral), `'filled_black'` (dark) |
| `shape` | `string` | Button shape | `'rectangular'`, `'pill'` |

**Returns:** The action returns no value as it outputs HTML directly (`void`).

### Basic Usage

```php
// Render with default settings.
do_action( 'googlesitekit_render_sign_in_with_google_button' );
```

This will output a Sign in with Google button with default styling and behavior configured in Site Kit settings.

```php
// Render with custom CSS class and "text" settings.
do_action( 'googlesitekit_render_sign_in_with_google_button', array(
    'class' => 'highlighted',
    'text'  => 'continue_with',
) );
```

This will output a Sign in with Google button with a custom CSS class you can use to style the button and a custom `"text"` value that may differ from the site-wide, default setting.

## Shortcode

Site Kit also provides a shortcode for rendering the Sign in with Google button. This is useful if you are using a non-block-based editor or otherwise cannot use the Gutenberg block but want to output a Sign in with Google button in your page content.

The shortcode can be used like this:

```
[site_kit_sign_in_with_google]
```

The shortcode accepts the same customization attributes as the PHP action:

```
[site_kit_sign_in_with_google class="my-custom-class" text="continue_with" theme="filled_blue" shape="pill"]
```

**Shortcode Attributes:**

- `class` - Additional CSS class(es) to add to the button container
- `shape` - Button shape (see options in "parameters" above)
- `text` - Button text variation (see options in "parameters" above)
- `theme` - Button color theme (see options in "parameters" above)

The shortcode is useful for:

- Adding the button via the WordPress block editor (in text mode)
- Including the button in widgets that support shortcodes
- Embedding the button in page builders
- Any context where using the Gutenberg block/PHP code directly is not possible

## Behavior When Not Connected

You can use the PHP action or Shortcode even if Sign in with Google is not connected. If Site Kit cannot render a Sign in with Google button for any reason, no button will be output and no error/warning will be displayed.

The Sign in with Google button will **NOT** render in the following scenarios:

- Sign in with Google is not connected in Site Kit
- Your site is not using HTTPS/SSL (Sign in with Google requires HTTPS for security)

## Examples

### Example 1: Custom Login Form

```php
function my_custom_login_form() {
    ?>
    <form id="my-login-form" method="post">
        <h2>Login to Your Account</h2>

        <!-- Traditional username/password fields -->
        <input type="text" name="username" placeholder="Username" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Log In</button>

        <!-- Sign in with Google option -->
        <div class="alternative-login">
            <p>Or sign in with:</p>
            <?php
            do_action(
                'googlesitekit_render_sign_in_with_google_button',
                array(
                    'class' => 'my-google-signin',
                    'text'  => 'signin_with',
                    'theme' => 'outline',
                )
            );
            ?>
        </div>
    </form>
    <?php
}
```

### Example 2: WordPress Content using Shortcode

```
<h3>Quick Login</h3>

[site_kit_sign_in_with_google class="center-button" shape="pill"]
```

## Styling the Button

The button container can be styled using CSS. The default class is always present, and you can add your own:

```css
.googlesitekit-sign-in-with-google__frontend-output-button {
    margin: 20px 0;
    text-align: center;
}
```

**Note:** The button itself is rendered by Google's JavaScript and follows Google's design guidelines. The styling you apply affects only the container `div`.

## Additional Resources

- [Site Kit Sign in with Google Documentation](https://sitekit.withgoogle.com/documentation/supported-services/sign-in-with-google) - Check if you can't get a button to appear
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web) - Includes styling examples, etc.
- [Site Kit Support](https://github.com/google/site-kit-wp/issues) - Report issues or ask questions
