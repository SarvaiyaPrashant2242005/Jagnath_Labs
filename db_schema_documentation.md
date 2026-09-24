# Jagnath Labs Database Schema Documentation

This document provides a detailed breakdown of all the tables, columns, data types, and relationships in the PostgreSQL database. This can be used to construct a visualization in drawSQL or other database design tools.

## Tables and Columns

### Table: `users` (Model: `Users`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `name` | `VARCHAR(255)` | `NO` |  | `` |
| `email` | `VARCHAR(255)` | `NO` |  | `` |
| `password` | `VARCHAR(255)` | `NO` |  | `` |
| `role` | `ENUM` | `YES` |  | `User` |
| `status` | `ENUM` | `YES` |  | `Active` |
| `reset_otp` | `VARCHAR(255)` | `YES` |  | `` |
| `reset_otp_expires_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `refresh_tokens` (Model: `RefreshTokens`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `user_id` | `UUID` | `NO` | 🔗 FK -> `users`.`id` | `` |
| `token_hash` | `VARCHAR(255)` | `NO` |  | `` |
| `expires_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `companies` (Model: `Company`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `userId` | `UUID` | `YES` | 🔗 FK -> `users`.`id` | `` |
| `company_code` | `VARCHAR(255)` | `NO` |  | `` |
| `company_name` | `VARCHAR(255)` | `NO` |  | `` |
| `company_email` | `VARCHAR(255)` | `YES` |  | `` |
| `contact_number` | `VARCHAR(255)` | `YES` |  | `` |
| `address` | `TEXT` | `YES` |  | `` |
| `city` | `VARCHAR(255)` | `YES` |  | `` |
| `state` | `VARCHAR(255)` | `YES` |  | `` |
| `logo` | `VARCHAR(255)` | `YES` |  | `` |
| `test_request_logo` | `VARCHAR(255)` | `YES` |  | `` |
| `test_report_logo` | `VARCHAR(255)` | `YES` |  | `` |
| `quotation_logo` | `VARCHAR(255)` | `YES` |  | `` |
| `signature` | `VARCHAR(255)` | `YES` |  | `` |
| `status` | `ENUM` | `YES` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `user_companies` (Model: `UserCompanies`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `user_id` | `UUID` | `NO` | 🔗 FK -> `users`.`id` | `` |
| `company_id` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `is_default` | `BOOLEAN` | `YES` |  | `false` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `clients` (Model: `Client`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `clientName` | `VARCHAR(255)` | `NO` |  | `` |
| `contactNumber` | `VARCHAR(255)` | `NO` |  | `` |
| `office_address` | `TEXT` | `NO` |  | `N/A` |
| `plant_address` | `TEXT` | `NO` |  | `N/A` |
| `address` | `TEXT` | `YES` |  | `` |
| `city` | `VARCHAR(255)` | `NO` |  | `` |
| `state` | `VARCHAR(255)` | `YES` |  | `` |
| `email` | `VARCHAR(255)` | `YES` |  | `` |
| `gender` | `VARCHAR(255)` | `NO` |  | `` |
| `status` | `ENUM` | `YES` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `parameters` (Model: `Parameter`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `subCategoryId` | `UUID` | `YES` | 🔗 FK -> `sub_categories`.`id` | `` |
| `location_sample_id` | `UUID` | `YES` | 🔗 FK -> `location_of_samples`.`id` | `` |
| `parameterName` | `VARCHAR(255)` | `NO` |  | `` |
| `description` | `TEXT` | `YES` |  | `` |
| `testMethod` | `VARCHAR(255)` | `YES` |  | `` |
| `unit` | `VARCHAR(255)` | `YES` |  | `` |
| `is_permissible_limit_applicable` | `BOOLEAN` | `NO` |  | `false` |
| `permissible_limit` | `VARCHAR(255)` | `YES` |  | `` |
| `price` | `DECIMAL(10,2)` | `YES` |  | `0` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `categories` (Model: `Category`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `departmentId` | `UUID` | `YES` | 🔗 FK -> `departments`.`id` | `` |
| `name` | `VARCHAR(255)` | `NO` |  | `` |
| `description` | `TEXT` | `YES` |  | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `test_requests` (Model: `TestRequest`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `clientId` | `UUID` | `NO` | 🔗 FK -> `clients`.`id` | `` |
| `address` | `TEXT` | `YES` |  | `` |
| `email` | `VARCHAR(255)` | `YES` |  | `` |
| `locationOfSample` | `VARCHAR(255)` | `YES` |  | `` |
| `contactPerson` | `VARCHAR(255)` | `YES` |  | `` |
| `contactNumber` | `VARCHAR(255)` | `YES` |  | `` |
| `dateOfCollection` | `VARCHAR(255)` | `YES` |  | `` |
| `dateOfReceipt` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleCollectedBy` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleQuantity` | `VARCHAR(255)` | `YES` |  | `` |
| `fieldDataSheet` | `VARCHAR(255)` | `YES` |  | `` |
| `packingDetails` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleIdNumber` | `VARCHAR(255)` | `YES` |  | `` |
| `reportNumber` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleParticular` | `TEXT` | `YES` |  | `` |
| `departmentId` | `UUID` | `YES` | 🔗 FK -> `departments`.`id` | `` |
| `category_id` | `UUID` | `YES` | 🔗 FK -> `categories`.`id` | `` |
| `equipmentAvailability` | `VARCHAR(255)` | `YES` |  | `` |
| `referenceStandardAvailability` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleAdequacy` | `VARCHAR(255)` | `YES` |  | `` |
| `testMethodAvailability` | `VARCHAR(255)` | `YES` |  | `` |
| `trainedPersonAvailability` | `VARCHAR(255)` | `YES` |  | `` |
| `reportIssueDays` | `VARCHAR(255)` | `YES` |  | `` |
| `reviewedBy` | `VARCHAR(255)` | `YES` |  | `` |
| `customerRepresentativeSignature` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleReceivedSignature` | `VARCHAR(255)` | `YES` |  | `` |
| `customerRepresentativeName` | `VARCHAR(255)` | `YES` |  | `` |
| `sampleReceiverName` | `VARCHAR(255)` | `YES` |  | `` |
| `testProtocol` | `VARCHAR(255)` | `YES` |  | `` |
| `remarks` | `TEXT` | `YES` |  | `` |
| `formTitle` | `VARCHAR(255)` | `YES` |  | `` |
| `formType` | `ENUM` | `NO` |  | `Regular` |
| `include_caution` | `BOOLEAN` | `NO` |  | `false` |
| `caution_id` | `UUID` | `YES` | 🔗 FK -> `caution_master`.`id` | `` |
| `sub_category_id` | `UUID` | `YES` | 🔗 FK -> `sub_categories`.`id` | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `quotation_required` | `VARCHAR(255)` | `YES` |  | `No` |
| `quotation_type` | `VARCHAR(255)` | `YES` |  | `` |
| `industry_type` | `VARCHAR(50)` | `YES` |  | `` |
| `industry_price` | `INTEGER` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `test_reports` (Model: `TestReport`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `test_request_id` | `UUID` | `YES` | 🔗 FK -> `test_requests`.`id` | `` |
| `report_number` | `VARCHAR(255)` | `NO` |  | `` |
| `reference_no` | `VARCHAR(255)` | `YES` |  | `` |
| `report_issued_to` | `VARCHAR(255)` | `NO` |  | `` |
| `agency_name` | `VARCHAR(255)` | `YES` |  | `` |
| `agency_address` | `TEXT` | `YES` |  | `` |
| `details_of_sample` | `VARCHAR(255)` | `YES` |  | `` |
| `packing_details` | `VARCHAR(255)` | `YES` |  | `` |
| `date_of_receipt` | `DATE` | `YES` |  | `` |
| `sample_quantity` | `VARCHAR(255)` | `YES` |  | `` |
| `sampling_location` | `VARCHAR(255)` | `YES` |  | `` |
| `condition_on_receipt` | `VARCHAR(255)` | `YES` |  | `` |
| `sample_collected_by` | `VARCHAR(255)` | `YES` |  | `` |
| `name_of_work` | `TEXT` | `YES` |  | `` |
| `starting_date_of_test` | `DATE` | `YES` |  | `` |
| `completion_date_of_test` | `DATE` | `YES` |  | `` |
| `section_header` | `VARCHAR(255)` | `YES` |  | `` |
| `format_no` | `VARCHAR(255)` | `YES` |  | `` |
| `format_date` | `VARCHAR(255)` | `YES` |  | `` |
| `reviewed_by` | `VARCHAR(255)` | `YES` |  | `` |
| `reviewed_by_signature` | `TEXT` | `YES` |  | `` |
| `authorized_signatory` | `VARCHAR(255)` | `YES` |  | `` |
| `signature_image` | `TEXT` | `YES` |  | `` |
| `parameters_list` | `JSONB` | `YES` |  | `[]` |
| `status` | `VARCHAR(255)` | `NO` |  | `Completed` |
| `show_permissible_limits` | `BOOLEAN` | `NO` |  | `true` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `category_parameter_mapping` (Model: `CategoryParameter`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `categoryId` | `UUID` | `NO` | 🔗 FK -> `categories`.`id` | `` |
| `parameterId` | `UUID` | `NO` | 🔗 FK -> `parameters`.`id` | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `test_request_parameters` (Model: `TestRequestParameter`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `testRequestId` | `UUID` | `NO` | 🔗 FK -> `test_requests`.`id` | `` |
| `parameterId` | `UUID` | `NO` | 🔗 FK -> `parameters`.`id` | `` |
| `testMethod` | `VARCHAR(255)` | `YES` |  | `` |
| `unit` | `VARCHAR(255)` | `YES` |  | `` |
| `result` | `VARCHAR(255)` | `YES` |  | `null` |
| `remark` | `VARCHAR(255)` | `YES` |  | `` |
| `price` | `DECIMAL(10,2)` | `YES` |  | `0` |
| `sequence` | `INTEGER` | `YES` |  | `0` |
| `status` | `VARCHAR(255)` | `NO` |  | `Pending` |
| `enteredBy` | `VARCHAR(255)` | `YES` |  | `` |
| `enteredAt` | `VARCHAR(255)` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `price_master` (Model: `PriceMaster`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `company_id` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `category_id` | `UUID` | `NO` | 🔗 FK -> `categories`.`id` | `` |
| `parameter_id` | `UUID` | `NO` | 🔗 FK -> `parameters`.`id` | `` |
| `price` | `DECIMAL(10,2)` | `NO` |  | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_by` | `UUID` | `YES` |  | `` |
| `updated_by` | `UUID` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `caution_master` (Model: `Caution`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `YES` | 🔗 FK -> `companies`.`id` | `` |
| `title` | `VARCHAR(150)` | `NO` |  | `` |
| `description` | `TEXT` | `NO` |  | `` |
| `report_type` | `ENUM` | `NO` |  | `BOTH` |
| `status` | `BOOLEAN` | `NO` |  | `true` |
| `sort_order` | `INTEGER` | `NO` |  | `1` |
| `created_by` | `UUID` | `YES` |  | `` |
| `updated_by` | `UUID` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `sub_categories` (Model: `SubCategory`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `categoryId` | `UUID` | `NO` | 🔗 FK -> `categories`.`id` | `` |
| `name` | `VARCHAR(255)` | `NO` |  | `` |
| `description` | `TEXT` | `YES` |  | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `location_of_samples` (Model: `LocationSample`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `company_id` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `name` | `VARCHAR(150)` | `NO` |  | `` |
| `subCategoryId` | `UUID` | `YES` | 🔗 FK -> `sub_categories`.`id` | `` |
| `description` | `TEXT` | `YES` |  | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_by` | `UUID` | `YES` |  | `` |
| `updated_by` | `UUID` | `YES` |  | `` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `departments` (Model: `Department`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `companyId` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `name` | `VARCHAR(255)` | `NO` |  | `` |
| `description` | `TEXT` | `YES` |  | `` |
| `status` | `ENUM` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

### Table: `audit_quotations` (Model: `AuditQuotation`)

| Column Name | Data Type | Allow Null | Key / Reference | Default Value |
| --- | --- | --- | --- | --- |
| `id` | `UUID` | `YES` | 🔑 PK | `{}` |
| `test_request_id` | `UUID` | `NO` | 🔗 FK -> `test_requests`.`id` | `` |
| `company_id` | `UUID` | `NO` | 🔗 FK -> `companies`.`id` | `` |
| `client_id` | `UUID` | `NO` | 🔗 FK -> `clients`.`id` | `` |
| `quotation_number` | `VARCHAR(255)` | `YES` |  | `` |
| `quotation_date` | `VARCHAR(255)` | `YES` |  | `` |
| `revised_date` | `VARCHAR(255)` | `YES` |  | `` |
| `financial_year` | `VARCHAR(255)` | `YES` |  | `` |
| `reference` | `VARCHAR(255)` | `YES` |  | `` |
| `subject` | `VARCHAR(255)` | `YES` |  | `` |
| `intro_text` | `TEXT` | `YES` |  | `` |
| `accreditation_text` | `TEXT` | `YES` |  | `` |
| `scope_text` | `TEXT` | `YES` |  | `` |
| `terms_text` | `TEXT` | `YES` |  | `` |
| `charges` | `TEXT` | `YES` |  | `` |
| `annexure` | `TEXT` | `YES` |  | `` |
| `contact_person` | `VARCHAR(255)` | `YES` |  | `` |
| `signatory_name` | `VARCHAR(255)` | `YES` |  | `` |
| `signatory_designation` | `VARCHAR(255)` | `YES` |  | `` |
| `signatory_signature` | `TEXT` | `YES` |  | `` |
| `stamp_image` | `TEXT` | `YES` |  | `` |
| `status` | `VARCHAR(50)` | `NO` |  | `Active` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NO` |  | `` |
| `deleted_at` | `TIMESTAMP WITH TIME ZONE` | `YES` |  | `` |

## Entity-Relationship (ER) Connections

Here is the mapping of foreign key connections and associations defined in the Sequelize index configuration:

| Source Table | Column / Key | Target Table | Association Type |
| --- | --- | --- | --- |
| `users` | `user_id` | `refresh_tokens` | `HasMany` |
| `users` | `user_id` | `companies` | `BelongsToMany` |
| `users` | `userId` | `companies` | `HasOne` |
| `refresh_tokens` | `user_id` | `users` | `BelongsTo` |
| `companies` | `company_id` | `users` | `BelongsToMany` |
| `companies` | `userId` | `users` | `BelongsTo` |
| `companies` | `companyId` | `clients` | `HasMany` |
| `companies` | `companyId` | `parameters` | `HasMany` |
| `companies` | `companyId` | `categories` | `HasMany` |
| `companies` | `companyId` | `test_requests` | `HasMany` |
| `companies` | `companyId` | `test_reports` | `HasMany` |
| `companies` | `companyId` | `category_parameter_mapping` | `HasMany` |
| `companies` | `companyId` | `price_master` | `HasMany` |
| `companies` | `companyId` | `caution_master` | `HasMany` |
| `companies` | `companyId` | `sub_categories` | `HasMany` |
| `companies` | `companyId` | `location_of_samples` | `HasMany` |
| `companies` | `companyId` | `departments` | `HasMany` |
| `clients` | `companyId` | `companies` | `BelongsTo` |
| `clients` | `clientId` | `test_requests` | `HasMany` |
| `parameters` | `companyId` | `companies` | `BelongsTo` |
| `parameters` | `parameterId` | `category_parameter_mapping` | `HasMany` |
| `parameters` | `parameterId` | `test_request_parameters` | `HasMany` |
| `parameters` | `parameterId` | `price_master` | `HasMany` |
| `parameters` | `subCategoryId` | `sub_categories` | `BelongsTo` |
| `parameters` | `locationSampleId` | `location_of_samples` | `BelongsTo` |
| `categories` | `companyId` | `companies` | `BelongsTo` |
| `categories` | `categoryId` | `category_parameter_mapping` | `HasMany` |
| `categories` | `categoryId` | `price_master` | `HasMany` |
| `categories` | `categoryId` | `sub_categories` | `HasMany` |
| `categories` | `categoryId` | `test_requests` | `HasMany` |
| `categories` | `departmentId` | `departments` | `BelongsTo` |
| `test_requests` | `companyId` | `companies` | `BelongsTo` |
| `test_requests` | `clientId` | `clients` | `BelongsTo` |
| `test_requests` | `testRequestId` | `test_request_parameters` | `HasMany` |
| `test_requests` | `cautionId` | `caution_master` | `BelongsTo` |
| `test_requests` | `categoryId` | `categories` | `BelongsTo` |
| `test_requests` | `subCategoryId` | `sub_categories` | `BelongsTo` |
| `test_requests` | `departmentId` | `departments` | `BelongsTo` |
| `test_requests` | `testRequestId` | `test_reports` | `HasOne` |
| `test_requests` | `testRequestId` | `audit_quotations` | `HasOne` |
| `test_reports` | `companyId` | `companies` | `BelongsTo` |
| `test_reports` | `testRequestId` | `test_requests` | `BelongsTo` |
| `category_parameter_mapping` | `companyId` | `companies` | `BelongsTo` |
| `category_parameter_mapping` | `categoryId` | `categories` | `BelongsTo` |
| `category_parameter_mapping` | `parameterId` | `parameters` | `BelongsTo` |
| `test_request_parameters` | `testRequestId` | `test_requests` | `BelongsTo` |
| `test_request_parameters` | `parameterId` | `parameters` | `BelongsTo` |
| `price_master` | `companyId` | `companies` | `BelongsTo` |
| `price_master` | `categoryId` | `categories` | `BelongsTo` |
| `price_master` | `parameterId` | `parameters` | `BelongsTo` |
| `caution_master` | `companyId` | `companies` | `BelongsTo` |
| `caution_master` | `cautionId` | `test_requests` | `HasMany` |
| `sub_categories` | `categoryId` | `categories` | `BelongsTo` |
| `sub_categories` | `companyId` | `companies` | `BelongsTo` |
| `sub_categories` | `subCategoryId` | `parameters` | `HasMany` |
| `sub_categories` | `subCategoryId` | `test_requests` | `HasMany` |
| `sub_categories` | `subCategoryId` | `location_of_samples` | `HasMany` |
| `location_of_samples` | `companyId` | `companies` | `BelongsTo` |
| `location_of_samples` | `locationSampleId` | `parameters` | `HasMany` |
| `location_of_samples` | `subCategoryId` | `sub_categories` | `BelongsTo` |
| `departments` | `companyId` | `companies` | `BelongsTo` |
| `departments` | `departmentId` | `categories` | `HasMany` |
| `departments` | `departmentId` | `test_requests` | `HasMany` |
| `audit_quotations` | `testRequestId` | `test_requests` | `BelongsTo` |
| `audit_quotations` | `companyId` | `companies` | `BelongsTo` |
| `audit_quotations` | `clientId` | `clients` | `BelongsTo` |
