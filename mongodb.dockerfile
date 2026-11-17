# MongoDB image for the compose stack of social-network-api.
#
# The service builds from this file instead of pointing at a registry image
# (R91). The base image is pinned by digest.
FROM mongo:9@sha256:b0c835c26e5997413e985000f1013c275377cd9607761c1784d486f6dd620b7f

# The database files live in /data/db, which the compose stack mounts from
# var/mongo. The permissions of that directory are set on the host side.
WORKDIR /data/db
