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

namespace Google\Service\Webcontentpublisher\Resource;

use Google\Service\Webcontentpublisher\ListPublicationsResponse;
use Google\Service\Webcontentpublisher\Publication;

/**
 * The "publications" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\Webcontentpublisher(...);
 *   $publications = $webcontentpublisherService->organizations_publications;
 *  </code>
 */
class OrganizationsPublications extends \Google\Service\Resource
{
  /**
   * Creates a publication. (publications.create)
   *
   * @param string $parent Required. The parent resource where this publication
   * will be created. Format: organizations/{organization}.
   * @param Publication $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string publicationId The unique identifier of the publication to
   * create.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function create($parent, Publication $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], Publication::class);
  }
  /**
   * Gets a publication. (publications.get)
   *
   * @param string $name Required. The resource name of the publication to
   * retrieve. Format: organizations/{organization}/publications/{publication}.
   * @param array $optParams Optional parameters.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Publication::class);
  }
  /**
   * Lists publications. (publications.listOrganizationsPublications)
   *
   * @param string $parent Required. The parent organization whose publications
   * to list. Format: organizations/{organization}.
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter A filter expression to filter the publications
   * returned.
   * @opt_param int pageSize The maximum number of publications to return.
   * @opt_param string pageToken A page token from a previous request.
   * @return ListPublicationsResponse
   * @throws \Google\Service\Exception
   */
  public function listOrganizationsPublications($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListPublicationsResponse::class);
  }
  /**
   * Updates a publication. (publications.patch)
   *
   * @param string $name Identifier. The resource name of the publication.
   * @param Publication $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask The list of fields to update.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function patch($name, Publication $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], Publication::class);
  }
}

class_alias(OrganizationsPublications::class, 'Google_Service_Webcontentpublisher_Resource_OrganizationsPublications');
