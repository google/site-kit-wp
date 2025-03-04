<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAccessBinding;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchDeleteAccessBindingsRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchGetAccessBindingsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListAccessBindingsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "accessBindings" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $accessBindings = $analyticsadminService->accounts_accessBindings;
 *  </code>
 */
class AccountsAccessBindings extends \Google\Service\Resource
{
  /**
   * Creates information about multiple access bindings to an account or property.
   * This method is transactional. If any AccessBinding cannot be created, none of
   * the AccessBindings will be created. (accessBindings.batchCreate)
   *
   * @param string $parent Required. The account or property that owns the access
   * bindings. The parent field in the CreateAccessBindingRequest messages must
   * either be empty or match this field. Formats: - accounts/{account} -
   * properties/{property}
   * @param GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsResponse
   * @throws \Google\Service\Exception
   */
  public function batchCreate($parent, GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsRequest $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('batchCreate', [$params], GoogleAnalyticsAdminV1alphaBatchCreateAccessBindingsResponse::class);
  }
  /**
   * Deletes information about multiple users' links to an account or property.
   * (accessBindings.batchDelete)
   *
   * @param string $parent Required. The account or property that owns the access
   * bindings. The parent of all provided values for the 'names' field in
   * DeleteAccessBindingRequest messages must match this field. Formats: -
   * accounts/{account} - properties/{property}
   * @param GoogleAnalyticsAdminV1alphaBatchDeleteAccessBindingsRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function batchDelete($parent, GoogleAnalyticsAdminV1alphaBatchDeleteAccessBindingsRequest $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('batchDelete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Gets information about multiple access bindings to an account or property.
   * (accessBindings.batchGet)
   *
   * @param string $parent Required. The account or property that owns the access
   * bindings. The parent of all provided values for the 'names' field must match
   * this field. Formats: - accounts/{account} - properties/{property}
   * @param array $optParams Optional parameters.
   *
   * @opt_param string names Required. The names of the access bindings to
   * retrieve. A maximum of 1000 access bindings can be retrieved in a batch.
   * Formats: - accounts/{account}/accessBindings/{accessBinding} -
   * properties/{property}/accessBindings/{accessBinding}
   * @return GoogleAnalyticsAdminV1alphaBatchGetAccessBindingsResponse
   * @throws \Google\Service\Exception
   */
  public function batchGet($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('batchGet', [$params], GoogleAnalyticsAdminV1alphaBatchGetAccessBindingsResponse::class);
  }
  /**
   * Updates information about multiple access bindings to an account or property.
   * (accessBindings.batchUpdate)
   *
   * @param string $parent Required. The account or property that owns the access
   * bindings. The parent of all provided AccessBinding in
   * UpdateAccessBindingRequest messages must match this field. Formats: -
   * accounts/{account} - properties/{property}
   * @param GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsResponse
   * @throws \Google\Service\Exception
   */
  public function batchUpdate($parent, GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsRequest $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('batchUpdate', [$params], GoogleAnalyticsAdminV1alphaBatchUpdateAccessBindingsResponse::class);
  }
  /**
   * Creates an access binding on an account or property. (accessBindings.create)
   *
   * @param string $parent Required. Formats: - accounts/{account} -
   * properties/{property}
   * @param GoogleAnalyticsAdminV1alphaAccessBinding $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAccessBinding
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaAccessBinding $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaAccessBinding::class);
  }
  /**
   * Deletes an access binding on an account or property. (accessBindings.delete)
   *
   * @param string $name Required. Formats: -
   * accounts/{account}/accessBindings/{accessBinding} -
   * properties/{property}/accessBindings/{accessBinding}
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Gets information about an access binding. (accessBindings.get)
   *
   * @param string $name Required. The name of the access binding to retrieve.
   * Formats: - accounts/{account}/accessBindings/{accessBinding} -
   * properties/{property}/accessBindings/{accessBinding}
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAccessBinding
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaAccessBinding::class);
  }
  /**
   * Lists all access bindings on an account or property.
   * (accessBindings.listAccountsAccessBindings)
   *
   * @param string $parent Required. Formats: - accounts/{account} -
   * properties/{property}
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of access bindings to return. The
   * service may return fewer than this value. If unspecified, at most 200 access
   * bindings will be returned. The maximum value is 500; values above 500 will be
   * coerced to 500.
   * @opt_param string pageToken A page token, received from a previous
   * `ListAccessBindings` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListAccessBindings` must match
   * the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListAccessBindingsResponse
   * @throws \Google\Service\Exception
   */
  public function listAccountsAccessBindings($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListAccessBindingsResponse::class);
  }
  /**
   * Updates an access binding on an account or property. (accessBindings.patch)
   *
   * @param string $name Output only. Resource name of this binding. Format:
   * accounts/{account}/accessBindings/{access_binding} or
   * properties/{property}/accessBindings/{access_binding} Example:
   * "accounts/100/accessBindings/200"
   * @param GoogleAnalyticsAdminV1alphaAccessBinding $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAccessBinding
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaAccessBinding $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaAccessBinding::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(AccountsAccessBindings::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_AccountsAccessBindings');
