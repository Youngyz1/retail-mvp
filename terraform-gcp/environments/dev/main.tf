module "vpc" {
  source = "../../modules/vpc"
  region = var.region
}

module "gke" {
  source     = "../../modules/gke"
  region     = var.region
  project_id = var.project_id
  network    = module.vpc.vpc_id
  subnetwork   = module.vpc.subnet_id
  gke_sa_email = module.iam.gke_sa_email
}

module "cloudsql" {
  source      = "../../modules/cloudsql"
  region      = var.region
  network     = module.vpc.vpc_id
  db_password = var.db_password

  depends_on = [module.vpc]
}

module "gcs" {
  source     = "../../modules/gcs"
  project_id = var.project_id
  region     = var.region
}

module "iam" {
  source     = "../../modules/iam"
  project_id = var.project_id
}

module "armor" {
  source = "../../modules/armor"
}
