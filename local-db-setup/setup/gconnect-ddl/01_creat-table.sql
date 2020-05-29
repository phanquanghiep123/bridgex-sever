
-- [MASTER TABLE] Application

DROP TABLE IF EXISTS application_master CASCADE;
CREATE TABLE application_master (
    id integer NOT NULL,
    name varchar(100) NOT NULL,
    customer_application boolean NOT NULL,
    administrator varchar(100),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(name)
);


-- [MASTER TABLE] Operator User

DROP TABLE IF EXISTS operator_user_master CASCADE;
CREATE TABLE operator_user_master (
    id SERIAL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email)
);


-- [MASTER TABLE] Region

DROP TABLE IF EXISTS region_master CASCADE;
CREATE TABLE region_master (
    id SERIAL,
    region_name varchar(255) NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(region_name)
);


-- Company

DROP TABLE IF EXISTS company CASCADE;
CREATE TABLE company (
    id SERIAL,
    name varchar(255) NOT NULL,
    description text,
    delete_flag varchar(20),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(name)
);


-- Company Locations

DROP TABLE IF EXISTS company_locations CASCADE;
CREATE TABLE company_locations (
    id SERIAL,
    company_id integer NOT NULL,
    name varchar(255) NOT NULL,
    telephone varchar(20) NOT NULL,
    fax varchar(20),
    email varchar(255) NOT NULL,
    zipcode varchar(20) NOT NULL,
    extra varchar(255),
    street varchar(255) NOT NULL,
    city varchar(50) NOT NULL,
    state varchar(50) NOT NULL,
    country varchar(50) NOT NULL,
    latitude numeric(8,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, name)
);


-- Company Available Application

DROP TABLE IF EXISTS company_application CASCADE;
CREATE TABLE company_application (
    id SERIAL,
    company_id integer NOT NULL,
    application_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, application_id)
);


-- Company Group

DROP TABLE IF EXISTS company_group CASCADE;
CREATE TABLE company_group (
    id SERIAL,
    company_id integer NOT NULL,
    name varchar(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, name)
);


-- Company User Profiles

DROP TABLE IF EXISTS company_user_profiles CASCADE;
CREATE TABLE company_user_profiles (
    id SERIAL,
    company_id integer NOT NULL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    description text,
    delete_flag varchar(20),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email)
);


-- Customer User Registration Status

DROP TABLE IF EXISTS user_registration_status CASCADE;
CREATE TABLE user_registration_status (
    id SERIAL,
    email varchar(255) NOT NULL,
    company_id integer NOT NULL,
    status integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email)
);


-- Customer User Available Application

DROP TABLE IF EXISTS user_applications CASCADE;
CREATE TABLE user_applications (
    id SERIAL,
    email varchar(255) NOT NULL,
    application_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, application_id)
);


-- Customer User Profiles

DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id SERIAL,
    company_id integer NOT NULL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email)
);


-- Customer User Belonging Group

DROP TABLE IF EXISTS user_groups CASCADE;
CREATE TABLE user_groups (
    id SERIAL,
    email varchar(255) NOT NULL,
    company_group_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, company_group_id)
);


-- Application Role

DROP TABLE IF EXISTS application_role CASCADE;
CREATE TABLE application_role (
    id SERIAL,
    company_group_id integer NOT NULL,
    application_id integer NOT NULL,
    role_id integer NOT NULL,
    role_name varchar(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_group_id, application_id, role_id)
);


-- Application Notification API Management

DROP TABLE IF EXISTS application_notice_api CASCADE;
CREATE TABLE application_notice_api (
    id SERIAL,
    application_id integer NOT NULL,
    name varchar(100) NOT NULL,
    url varchar(255) NOT NULL,
    basicauth_username varchar(100),
    basicauth_password varchar(100),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(application_id)
);


-- Asset Type Master

DROP TABLE IF EXISTS asset_type_master CASCADE;
CREATE TABLE asset_type_master (
    id SERIAL,
    asset_type_name varchar(255) NOT NULL,
    asset_type_kind integer NOT NULL DEFAULT 0,
    class_id varchar(20) NOT NULL,
    device_class varchar(50),
    manufacturer varchar(255),
    product_number varchar(255),
    order_no integer NOT NULL DEFAULT 0,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_type_name)
);


-- Assets

DROP TABLE IF EXISTS assets CASCADE;
CREATE TABLE assets (
    id SERIAL,
    asset_name varchar(255) NOT NULL,
    asset_type_id integer NOT NULL,
    company_location_id integer,
    region_id integer,
    asset_commissioning_operator varchar(255),
    asset_commissioning_timestamp timestamptz,
    alias varchar(255),
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_name,asset_type_id),
    FOREIGN KEY(asset_type_id) REFERENCES asset_type_master (id),
    FOREIGN KEY(company_location_id) REFERENCES company_locations (id),
    FOREIGN KEY(region_id) REFERENCES region_master (id)
);


-- Asset Activation

DROP TABLE IF EXISTS asset_activation CASCADE;
CREATE TABLE asset_activation (
    id SERIAL,
    asset_id integer NOT NULL,
    one_time_password varchar(255),
    expiration_date timestamp,
    access_id varchar(255),
    access_token varchar(255),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Asset Composite Relation

DROP TABLE IF EXISTS asset_composite_relation CASCADE;
CREATE TABLE asset_composite_relation (
    id SERIAL,
    asset_id integer NOT NULL,
    device_asset_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_id, device_asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id),
    FOREIGN KEY(device_asset_id) REFERENCES assets (id)
);


-- Asset Subparts

DROP TABLE IF EXISTS asset_subparts CASCADE;
CREATE TABLE asset_subparts (
    id SERIAL,
    asset_subpart_name varchar(255) NOT NULL,
    asset_id integer NOT NULL,
    asset_subpart_version varchar(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_subpart_name,asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Asset Groups

DROP TABLE IF EXISTS asset_groups CASCADE;
CREATE TABLE asset_groups (
    id SERIAL,
    asset_group_name varchar(255) NOT NULL,
    company_id integer NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_group_name, company_id),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Asset Groups Relation

DROP TABLE IF EXISTS asset_groups_relation CASCADE;
CREATE TABLE asset_groups_relation (
    id SERIAL,
    asset_group_id integer NOT NULL,
    asset_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_group_id,asset_id),
    FOREIGN KEY(asset_group_id) REFERENCES asset_groups (id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Customer User Belonging Aseet Group

DROP TABLE IF EXISTS user_asset_groups CASCADE;
CREATE TABLE user_asset_groups (
    id SERIAL,
    email varchar(255) NOT NULL,
    asset_group_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, asset_group_id)
);



-- [MASTER TABLE] Application

DROP TABLE IF EXISTS application_master CASCADE;
CREATE TABLE application_master (
    id integer NOT NULL,
    name varchar(100) NOT NULL,
    customer_application boolean NOT NULL,
    administrator varchar(100),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(name)
);


-- [MASTER TABLE] Operator User

DROP TABLE IF EXISTS operator_user_master CASCADE;
CREATE TABLE operator_user_master (
    id SERIAL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email)
);


-- [MASTER TABLE] Region

DROP TABLE IF EXISTS region_master CASCADE;
CREATE TABLE region_master (
    id SERIAL,
    region_name varchar(255) NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(region_name)
);


-- Company

DROP TABLE IF EXISTS company CASCADE;
CREATE TABLE company (
    id SERIAL,
    name varchar(255) NOT NULL,
    description text,
    delete_flag varchar(20),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(name)
);


-- Company Locations

DROP TABLE IF EXISTS company_locations CASCADE;
CREATE TABLE company_locations (
    id SERIAL,
    company_id integer NOT NULL,
    name varchar(255) NOT NULL,
    telephone varchar(20) NOT NULL,
    fax varchar(20),
    email varchar(255) NOT NULL,
    zipcode varchar(20) NOT NULL,
    extra varchar(255),
    street varchar(255) NOT NULL,
    city varchar(50) NOT NULL,
    state varchar(50) NOT NULL,
    country varchar(50) NOT NULL,
    latitude numeric(8,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, name),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Company Available Application

DROP TABLE IF EXISTS company_application CASCADE;
CREATE TABLE company_application (
    id SERIAL,
    company_id integer NOT NULL,
    application_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, application_id),
    FOREIGN KEY(company_id) REFERENCES company (id),
    FOREIGN KEY(application_id) REFERENCES application_master (id)
);


-- Company Group

DROP TABLE IF EXISTS company_group CASCADE;
CREATE TABLE company_group (
    id SERIAL,
    company_id integer NOT NULL,
    name varchar(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_id, name),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Company User Profiles

DROP TABLE IF EXISTS company_user_profiles CASCADE;
CREATE TABLE company_user_profiles (
    id SERIAL,
    company_id integer NOT NULL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    description text,
    delete_flag varchar(20),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Customer User Registration Status

DROP TABLE IF EXISTS user_registration_status CASCADE;
CREATE TABLE user_registration_status (
    id SERIAL,
    email varchar(255) NOT NULL,
    company_id integer NOT NULL,
    status integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Customer User Available Application

DROP TABLE IF EXISTS user_applications CASCADE;
CREATE TABLE user_applications (
    id SERIAL,
    email varchar(255) NOT NULL,
    application_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, application_id),
    FOREIGN KEY(email) REFERENCES user_registration_status (email),
    FOREIGN KEY(application_id) REFERENCES application_master (id)
);


-- Customer User Profiles

DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id SERIAL,
    company_id integer NOT NULL,
    user_id varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    display_name varchar(100) NOT NULL,
    given_name varchar(50),
    family_name varchar(50),
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(user_id),
    UNIQUE(email),
    FOREIGN KEY(company_id) REFERENCES company (id),
    FOREIGN KEY(email) REFERENCES user_registration_status (email)
);


-- Customer User Belonging Group

DROP TABLE IF EXISTS user_groups CASCADE;
CREATE TABLE user_groups (
    id SERIAL,
    email varchar(255) NOT NULL,
    company_group_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, company_group_id),
    FOREIGN KEY(email) REFERENCES user_profiles (email),
    FOREIGN KEY(company_group_id) REFERENCES company_group (id)
);


-- Application Role

DROP TABLE IF EXISTS application_role CASCADE;
CREATE TABLE application_role (
    id SERIAL,
    company_group_id integer NOT NULL,
    application_id integer NOT NULL,
    role_id integer NOT NULL,
    role_name varchar(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(company_group_id, application_id, role_id),
    FOREIGN KEY(company_group_id) REFERENCES company_group (id),
    FOREIGN KEY(application_id) REFERENCES application_master (id)
);


-- Application Notification API Management

DROP TABLE IF EXISTS application_notice_api CASCADE;
CREATE TABLE application_notice_api (
    id SERIAL,
    application_id integer NOT NULL,
    name varchar(100) NOT NULL,
    url varchar(255) NOT NULL,
    basicauth_username varchar(100),
    basicauth_password varchar(100),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(application_id),
    FOREIGN KEY(application_id) REFERENCES application_master (id)
);


-- Asset Type Master

DROP TABLE IF EXISTS asset_type_master CASCADE;
CREATE TABLE asset_type_master (
    id SERIAL,
    asset_type_name varchar(255) NOT NULL,
    asset_type_kind integer NOT NULL DEFAULT 0,
    class_id varchar(20) NOT NULL,
    device_class varchar(50),
    manufacturer varchar(255),
    product_number varchar(255),
    order_no integer NOT NULL DEFAULT 0,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_type_name)
);


-- Assets

DROP TABLE IF EXISTS assets CASCADE;
CREATE TABLE assets (
    id SERIAL,
    asset_name varchar(255) NOT NULL,
    asset_type_id integer NOT NULL,
    company_location_id integer,
    region_id integer,
    asset_commissioning_operator varchar(255),
    asset_commissioning_timestamp timestamptz,
    alias varchar(255),
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_name,asset_type_id),
    FOREIGN KEY(asset_type_id) REFERENCES asset_type_master (id),
    FOREIGN KEY(company_location_id) REFERENCES company_locations (id),
    FOREIGN KEY(region_id) REFERENCES region_master (id)
);


-- Asset Activation

DROP TABLE IF EXISTS asset_activation CASCADE;
CREATE TABLE asset_activation (
    id SERIAL,
    asset_id integer NOT NULL,
    one_time_password varchar(255),
    expiration_date timestamp,
    access_id varchar(255),
    access_token varchar(255),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Asset Composite Relation

DROP TABLE IF EXISTS asset_composite_relation CASCADE;
CREATE TABLE asset_composite_relation (
    id SERIAL,
    asset_id integer NOT NULL,
    device_asset_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_id, device_asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id),
    FOREIGN KEY(device_asset_id) REFERENCES assets (id)
);


-- Asset Subparts

DROP TABLE IF EXISTS asset_subparts CASCADE;
CREATE TABLE asset_subparts (
    id SERIAL,
    asset_subpart_name varchar(255) NOT NULL,
    asset_id integer NOT NULL,
    asset_subpart_version varchar(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_subpart_name,asset_id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Asset Groups

DROP TABLE IF EXISTS asset_groups CASCADE;
CREATE TABLE asset_groups (
    id SERIAL,
    asset_group_name varchar(255) NOT NULL,
    company_id integer NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_group_name, company_id),
    FOREIGN KEY(company_id) REFERENCES company (id)
);


-- Asset Groups Relation

DROP TABLE IF EXISTS asset_groups_relation CASCADE;
CREATE TABLE asset_groups_relation (
    id SERIAL,
    asset_group_id integer NOT NULL,
    asset_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(asset_group_id,asset_id),
    FOREIGN KEY(asset_group_id) REFERENCES asset_groups (id),
    FOREIGN KEY(asset_id) REFERENCES assets (id)
);


-- Customer User Belonging Aseet Group

DROP TABLE IF EXISTS user_asset_groups CASCADE;
CREATE TABLE user_asset_groups (
    id SERIAL,
    email varchar(255) NOT NULL,
    asset_group_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE(email, asset_group_id),
    FOREIGN KEY(email) REFERENCES user_profiles (email),
    FOREIGN KEY(asset_group_id) REFERENCES asset_groups (id)
);